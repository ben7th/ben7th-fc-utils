const TableStore = require('tablestore')
const DATA_TYPES = require('./DATA_TYPES')
const getAsyncOtsClient = require('./getAsyncOtsClient')

// usage:
/*
const table = defineOtsTable({
  keys: {
    _id: 'STRING',
    abbr: 'STRING',
  },
  columns: {
    info: 'JSON'
  }
})

// 存
let { data, timestamps, otsResponse } = await table.putData({ _id, abbr, info })

// 取
let { data, timestamps, otsResponse } = await table.getData({ _id, abbr })
let { _id, abbr, info } = data
*/
// 定义一个 Ots Table 结构，以便于简化地存取数据
const defineOtsTable = (
  { tableName, keys, columns }, 
  { endpoint, instancename }
) => {
  return new OtsTable({ 
    tableName, keys, columns, 
    asyncOtsClient: getAsyncOtsClient({ endpoint, instancename })
  })
}

class OtsTable {
  constructor ({ tableName, keys,  columns, asyncOtsClient }) {
    this.tableName = tableName
    this.keys = keys
    this.columns = columns

    this.asyncOtsClient = asyncOtsClient
  }

  // 写数据
  // 如果主键相同，会覆盖该行全部数据
  // 但不会覆盖 createdAt TODO 因为已经实现了 updateData 需要去掉这个特性
  async putData (rawData) {
    // 先尝试读数据，主要是为了不覆盖 createdAt
    let _getRes = await this.getData(rawData)
    let ts = _getRes.timestamps
    let oldCreatedAt = ts ? ts.createdAt : null

    let tableName = this.tableName
    let primaryKey = _packOtsValueArray({ columnDefines: this.keys, rawData })
    let attributeColumns = _packOtsValueArray({ columnDefines: this.columns, rawData })

    // 增加时间戳数据
    let now = new Date()
    let rawCreatedAt = oldCreatedAt ? oldCreatedAt : now
    let rawUpdatedAt = now

    let otsCreatedAt = _raw_to_ots({ columnRawValue: rawCreatedAt, type: DATA_TYPES.DATE })
    let otsUpdatedAt = _raw_to_ots({ columnRawValue: rawUpdatedAt, type: DATA_TYPES.DATE })

    attributeColumns.push({ createdAt: otsCreatedAt })
    attributeColumns.push({ updatedAt: otsUpdatedAt })

    let params = _buildPutRowParams({ tableName, primaryKey, attributeColumns })
    let otsResponse = await this.asyncOtsClient.putRow(params)
    let timestamps = { createdAt: rawCreatedAt, updatedAt: rawUpdatedAt }

    return { data: rawData, timestamps, otsResponse }
  }

  // 更新数据
  // 需要传两个参数：
  // primaryKeysData 用于查询旧数据
  // newRawData 用于更新数据
  // 旧数据已经存在的属性不会被覆盖
  async updateData (primaryKeysData, newRawData) {
    // 先读旧数据
    let _getRes = await this.getData(primaryKeysData)
    if (!_getRes.data) {
      throw new Error('updateData: 要更新的旧数据不存在')
    }
    let oldRawData = _getRes.data
    let oldTimestamps = _getRes.timestamps

    let mergedRawData = Object.assign({}, oldRawData, newRawData, primaryKeysData)

    let tableName = this.tableName
    let primaryKey = _packOtsValueArray({ 
      columnDefines: this.keys, rawData: mergedRawData })
    let attributeColumns = _packOtsValueArray({ 
      columnDefines: this.columns, rawData: mergedRawData })

    // 增加时间戳数据
    let now = new Date()
    let rawCreatedAt = oldTimestamps.createdAt
    let rawUpdatedAt = now

    let otsCreatedAt = _raw_to_ots({ columnRawValue: rawCreatedAt, type: DATA_TYPES.DATE })
    let otsUpdatedAt = _raw_to_ots({ columnRawValue: rawUpdatedAt, type: DATA_TYPES.DATE })

    attributeColumns.push({ createdAt: otsCreatedAt })
    attributeColumns.push({ updatedAt: otsUpdatedAt })

    let params = _buildPutRowParams({ tableName, primaryKey, attributeColumns })
    let otsResponse = await this.asyncOtsClient.putRow(params)
    let timestamps = { createdAt: rawCreatedAt, updatedAt: rawUpdatedAt }

    return { data: mergedRawData, timestamps, otsResponse }
  }

  // 读数据
  // 如果没有读到数据，返回结果的 data 为 null
  async getData (keysData) {
    let tableName = this.tableName

    let primaryKey = _packOtsValueArray({ columnDefines: this.keys, rawData: keysData })

    // 不作查询限制，返回全部字段
    // let columnsToGet = Object.keys(this.columns)

    let params = _buildGetRowParams({ tableName, primaryKey })
    let otsResponse = await this.asyncOtsClient.getRow(params)
    let { data, timestamps } = this.packOneRowData({ row: otsResponse.row })

    return { data, timestamps, otsResponse }
  }

  // 读取全部数据
  // 仅限于数据 < 1000 条的时候
  // 使用 getRange 实现，不能分页
  async simpleListAll () {
    let tableName = this.tableName
    let inclusiveStartPrimaryKey = Object.keys(this.keys).map(key => {
      let res = {}
      res[key] = TableStore.INF_MIN
      return res
    })
    let exclusiveEndPrimaryKey = Object.keys(this.keys).map(key => {
      let res = {}
      res[key] = TableStore.INF_MAX
      return res
    })

    let params = {
      tableName,
      direction: TableStore.Direction.FORWARD,
      inclusiveStartPrimaryKey,
      exclusiveEndPrimaryKey,
      limit: 1000
    }

    // console.log(params)
    let otsResponse = await this.asyncOtsClient.getRange(params)
    // console.log(otsResponse)
    let list = otsResponse.rows.map(row => this.packOneRowData({ row }))

    return { list, otsResponse }
  }

  // { name: 'abbr', value: 'test-114514' }
  // 目前只支持字符串属性
  async listAllWithFieldValue ({ field, value }) {
    let condition = new TableStore.SingleColumnCondition(field, value, TableStore.ComparatorType.EQUAL)

    let tableName = this.tableName
    let inclusiveStartPrimaryKey = Object.keys(this.keys).map(key => {
      let res = {}
      res[key] = TableStore.INF_MIN
      return res
    })
    let exclusiveEndPrimaryKey = Object.keys(this.keys).map(key => {
      let res = {}
      res[key] = TableStore.INF_MAX
      return res
    })

    let params = {
      tableName,
      direction: TableStore.Direction.FORWARD,
      inclusiveStartPrimaryKey,
      exclusiveEndPrimaryKey,
      limit: 1000,
      columnFilter: condition
    }

    // console.log(params)
    let otsResponse = await this.asyncOtsClient.getRange(params)
    // console.log(otsResponse)
    let list = otsResponse.rows.map(row => this.packOneRowData({ row }))

    return { list, otsResponse }
  }

  async deleteAllWithFieldValue ({ field, value }) {
    // 先查询，然后执行多行删除
    let { list } = await this.listAllWithFieldValue({ field, value })
    let _dataList = list.map(x => x.data)
    let primaryKeys = _dataList.map(x => {
      return _packOtsValueArray({ columnDefines: this.keys, rawData: x })
    })
    let tableName = this.tableName
    let params = _buildDeleteRowsParams({ tableName, primaryKeys })
    let otsResponse = await this.asyncOtsClient.batchWriteRow(params)
    return { otsResponse }
  }

  /* 返回结果的示例数据结构：
  {
    primaryKey: [ { name: 'abbr', value: 'test-114514' } ],
    attributes: [
      {
        columnName: 'createdAt',
        columnValue: [Int64],
        timestamp: [Int64]
      },
      {
        columnName: 'infoData',
        columnValue: '{"smile":"slime111"}',
        timestamp: [Int64]
      },
      {
        columnName: 'updatedAt',
        columnValue: [Int64],
        timestamp: [Int64]
      }
    ]
  }
  */

  // 包装读取的结果
  packOneRowData ({ row }) {
    let data = {}
    let timestamps = {}

    if (Object.keys(row).length === 0) {
      return { data: null, timestamps: null }
    }

    for (let keyItem of row.primaryKey) {
      let columnName = keyItem.name
      let columnOtsValue = keyItem.value
      let type = this.keys[columnName]
      data[columnName] = _ots_to_raw({ columnOtsValue, type })
    }

    for (let valueItem of row.attributes) {
      let columnName = valueItem.columnName
      let columnOtsValue = valueItem.columnValue
      let type = this.columns[columnName]

      // 时间戳
      if (columnName === 'createdAt' || columnName === 'updatedAt') {
        timestamps[columnName] = _ots_to_raw({ columnOtsValue, type: DATA_TYPES.DATE })
      } else {
        data[columnName] = _ots_to_raw({ columnOtsValue, type })
      }
    }

    return { data, timestamps }
  }
}

// 将传入的数据组织成 OTS 参数格式数组
const _packOtsValueArray = ({ columnDefines, rawData }) => {
  console.log('_packOtsValueArray', { columnDefines, rawData })
  return Object.entries(columnDefines).map(([columnName, type]) => {
    let columnRawValue = rawData[columnName]
    let columnOtsValue = _raw_to_ots({ columnRawValue, type })
    let res = {}
    if (columnOtsValue !== undefined && columnOtsValue !== null) {
      res[columnName] = columnOtsValue
    }
    return res
  })
}

const _raw_to_ots = ({ columnRawValue, type }) => {
  let columnOtsValue = columnRawValue

  if (type === DATA_TYPES.STRING) { columnOtsValue = columnRawValue }
  if (type === DATA_TYPES.INTEGER) { columnOtsValue = TableStore.Long.fromNumber(columnRawValue) }
  if (type === DATA_TYPES.DOUBLE) { columnOtsValue = columnRawValue }
  if (type === DATA_TYPES.BOOLEAN) { columnOtsValue = columnRawValue }
  // if (type === DATA_TYPES.BINARY) { } // buffer 如何处理？

  if (type === DATA_TYPES.JSON) { columnOtsValue = JSON.stringify(columnRawValue) }
  if (type === DATA_TYPES.DATE) { columnOtsValue = TableStore.Long.fromNumber(columnRawValue.getTime()) }

  return columnOtsValue
}

const _ots_to_raw = ({ columnOtsValue, type }) => {
  let columnRawValue = columnOtsValue

  if (type === DATA_TYPES.STRING) { columnRawValue = columnOtsValue }
  if (type === DATA_TYPES.INTEGER) { columnRawValue = columnOtsValue.toNumber() }
  if (type === DATA_TYPES.DOUBLE) { columnRawValue = columnOtsValue }
  if (type === DATA_TYPES.BOOLEAN) { columnRawValue = columnOtsValue }
  // if (type === DATA_TYPES.BINARY) { } // buffer 如何处理？

  if (type === DATA_TYPES.JSON) { columnRawValue = JSON.parse(columnOtsValue) }
  if (type === DATA_TYPES.DATE) { columnRawValue = new Date(columnOtsValue.toNumber()) }

  return columnRawValue
}

const CONDITION_ROW_EXIST_IGNORE = new TableStore.Condition(TableStore.RowExistenceExpectation.IGNORE, null)

const _buildDeleteRowsParams = ({ tableName, primaryKeys }) => {
  // https://help.aliyun.com/document_detail/56355.html?spm=a2c4g.11186623.6.1003.13261201rjtSfC
  return {
    tables: [
      {
        tableName, // 传入
        rows: primaryKeys.map(primaryKey => {
          return {
            type: 'DELETE',
            condition: CONDITION_ROW_EXIST_IGNORE,
            primaryKey
          }
        })
      }
    ]
  }
}

// 组织单行查询参数
const _buildGetRowParams = ({ tableName, primaryKey }) => {
  return {
    tableName, // 传入
    primaryKey, // 传入
    maxVersions: 10, // 最多可读取的版本数，设置为 10 即代表最多可读取 10 个版本。
  }
}

// 组织单行写入参数
// 备注：returnType
// NONE, Primarykey, AfterModify
const _buildPutRowParams = ({ tableName, primaryKey, attributeColumns }) => {
  return {
    tableName, // 传入
    condition: CONDITION_ROW_EXIST_IGNORE,
    primaryKey, // 传入
    attributeColumns, // 传入
    returnContent: { returnType: TableStore.ReturnType.Primarykey }
  }
}

defineOtsTable.DATA_TYPES = DATA_TYPES
module.exports = defineOtsTable
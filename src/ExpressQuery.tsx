import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Button, Input, Alert, Table, Drawer, Space, message,
  Popconfirm, Upload, Typography, Tag, Form, FloatButton,
  Select
} from 'antd';
import type { TableProps, UploadProps } from 'antd';
import {
  FileExcelOutlined, InboxOutlined, SearchOutlined,
  EditOutlined, SaveOutlined, UpOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import CreateSampleData from './CreateSampleData';

const { Dragger } = Upload;
const { Search } = Input;
const { Title, Text } = Typography;

interface ExpressData {
  key: string;
  trackingNumber: string; // 改回单个快递单号
  company: string;
  recipient: string;
  phone: string;
  address: string;
  status: string;
  rowIndex: number; // 原始行索引
  columnIndex: number; // 原始列索引
  columnName: string; // 列名（如：中通、申通等）
  [key: string]: any;
}

interface ExpressQueryProps { }

const ExpressQuery: React.FC<ExpressQueryProps> = () => {
  const [data, setData] = useState<ExpressData[]>([]);
  const [filteredData, setFilteredData] = useState<ExpressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [editingRecord, setEditingRecord] = useState<ExpressData | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 创建默认数据
  const createDefaultData = (): ExpressData[] => {
    const defaultTrackingNumbers = [
      // 中通快递单号
      { number: '75761365043766', column: '中通', company: '中通' },
      { number: '75761370314853', column: '中通', company: '中通' },
      { number: '75761778084401', column: '中通', company: '中通' },
      { number: '75701252115546', column: '中通', company: '中通' },
      // 申通快递单号
      { number: '77632957076153', column: '申通', company: '申通' },
      { number: '77716951501759', column: '申通', company: '申通' },
      { number: '77718014846666', column: '申通', company: '申通' },
      { number: '77637759935866', column: '申通', company: '申通' },
      // 圆通快递单号
      { number: 'YT894185215852', column: '圆通', company: '圆通' },
      { number: 'YT893990509270', column: '圆通', company: '圆通' },
      { number: 'YT893963976843', column: '圆通', company: '圆通' },
      { number: 'YT894201069876', column: '圆通', company: '圆通' },
      // 韵达快递单号
      { number: '46334069260168', column: '韵达', company: '韵达' },
      { number: '31866359263298', column: '韵达', company: '韵达' },
      { number: '46287276652932', column: '韵达', company: '韵达' },
      { number: '31843064579230', column: '韵达', company: '韵达' },
      // 其他快递单号（无法识别）
      { number: '98574940403', column: '邮政', company: '' },
      { number: '98560526232', column: '邮政', company: '' },
      { number: '98536949291', column: '邮政', company: '' },
      { number: '97296408178', column: '邮政', company: '' },
    ];

    return defaultTrackingNumbers.map((item, index) => ({
      key: index.toString(),
      trackingNumber: item.number,
      company: item.company,
      recipient: '',
      phone: '',
      address: '',
      status: '待处理',
      rowIndex: Math.floor(index / 4) + 1, // 模拟行索引
      columnIndex: index % 4, // 模拟列索引
      columnName: item.column,
      originalData: []
    }));
  };

  // 从public目录读取Excel文件作为默认数据
  const loadDefaultExcelData = async () => {
    try {
      setLoading(true);

      // 从public目录获取Excel文件
      const response = await fetch('/在仓问题件.xls');
      if (!response.ok) {
        throw new Error('无法加载默认Excel文件');
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 将工作表转换为二维数组
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      console.log('默认Excel数据:', jsonData);

      const processedData: ExpressData[] = [];
      let keyCounter = 0;

      // 遍历所有行和列
      jsonData.forEach((row: any[], rowIndex) => {
        if (Array.isArray(row)) {
          row.forEach((cell: any, columnIndex) => {
            const cellValue = cell ? cell.toString().trim() : '';

            // 检查是否为快递单号（跳过空值和标题行）
            if (cellValue &&
              cellValue.length > 5 &&
              rowIndex > 0 && // 跳过标题行
              /^[A-Za-z0-9]+$/.test(cellValue)) {

              const company = detectExpressCompany(cellValue);

              // 获取列名（从第一行）
              const headerRow = jsonData[0] as any[];
              const columnName = headerRow && headerRow[columnIndex]
                ? headerRow[columnIndex].toString()
                : `列${columnIndex + 1}`;

              processedData.push({
                key: keyCounter.toString(),
                trackingNumber: cellValue,
                company: company,
                recipient: '',
                phone: '',
                address: '',
                status: '待处理',
                rowIndex: rowIndex,
                columnIndex: columnIndex,
                columnName: columnName,
                originalData: jsonData
              });

              keyCounter++;
            }
          });
        }
      });

      console.log('处理后的默认数据:', processedData);

      if (processedData.length > 0) {
        setData(processedData);
        setFilteredData(processedData);
        message.success(`成功加载默认数据，共 ${processedData.length} 条快递信息`);
      } else {
        // 如果Excel文件没有数据，则使用硬编码的示例数据
        const fallbackData = createDefaultData();
        setData(fallbackData);
        setFilteredData(fallbackData);
        message.info('Excel文件中未找到快递数据，已加载示例数据');
      }

    } catch (error) {
      console.error('加载默认Excel文件失败:', error);
      // 如果加载失败，使用硬编码的示例数据作为备选
      const fallbackData = createDefaultData();
      setData(fallbackData);
      setFilteredData(fallbackData);
      message.warning('无法加载默认Excel文件，已加载示例数据');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时读取默认Excel文件
  React.useEffect(() => {
    // 确保页面滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 加载默认数据
    loadDefaultExcelData();
  }, []);

  // 快递公司识别函数 - 根据实际数据优化，无法识别时返回空字符串
  const detectExpressCompany = (trackingNumber: string): string => {
    if (!trackingNumber) return '';

    const cleanNumber = trackingNumber.toString().trim();

    const patterns = {
      '中通': /^(ZTO|6)\d{10,15}$|^7\d{11,15}$/,
      '圆通': /^(YT|D|1)\d{11,15}$|^7\d{11,15}$/,
      '申通': /^(STO|268)\d{10,15}$|^7\d{11,15}$/,
      '韵达': /^(YD|19|1)\d{11,15}$|^7\d{11,15}$/,
      '顺丰': /^(SF)\d{10,15}$|^[89]\d{11,15}$/,
      '德邦': /^(DP|3)\d{11,15}$/,
      '邮政EMS': /^(E[A-Z])\d{9}[A-Z]{2}$|^(JD|JT)\d{11,15}$/,
      '京东': /^(JD|VA|JT)\d{11,15}$/,
      '天天': /^(TT|88)\d{11,15}$/,
      '百世': /^(HT|A)\d{11,15}$/,
    };

    for (const [company, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleanNumber.toUpperCase())) {
        return company;
      }
    }
    return ''; // 无法识别时返回空字符串
  };

  // 处理Excel文件上传
  const handleFileUpload = (file: File) => {
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 将工作表转换为二维数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        console.log('上传文件数据:', jsonData);

        const processedData: ExpressData[] = [];
        let keyCounter = 0;

        // 遍历所有行和列
        jsonData.forEach((row: any[], rowIndex) => {
          if (Array.isArray(row)) {
            row.forEach((cell: any, columnIndex) => {
              const cellValue = cell ? cell.toString().trim() : '';

              // 检查是否为快递单号（跳过空值和标题行）
              if (cellValue &&
                cellValue.length > 5 &&
                rowIndex > 0 && // 跳过标题行
                /^[A-Za-z0-9]+$/.test(cellValue)) {

                const company = detectExpressCompany(cellValue);

                // 获取列名（从第一行）
                const headerRow = jsonData[0] as any[];
                const columnName = headerRow && headerRow[columnIndex]
                  ? headerRow[columnIndex].toString()
                  : `列${columnIndex + 1}`;

                processedData.push({
                  key: keyCounter.toString(),
                  trackingNumber: cellValue,
                  company: company,
                  recipient: '',
                  phone: '',
                  address: '',
                  status: '待处理',
                  rowIndex: rowIndex,
                  columnIndex: columnIndex,
                  columnName: columnName,
                  originalData: jsonData
                });

                keyCounter++;
              }
            });
          }
        });

        console.log('上传文件处理后数据:', processedData);
        setData(processedData);
        setFilteredData(processedData);
        setSearchValue('');
        message.success(`成功读取 ${processedData.length} 条快递信息`);
      } catch (error) {
        console.error('文件解析失败:', error);
        message.error('文件解析失败，请确保文件格式正确');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    return false; // 阻止自动上传
  };

  // Upload组件配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false; // 阻止默认上传行为
    },
    onDrop(e: React.DragEvent) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  // 搜索功能
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (!value) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item =>
      item.trackingNumber.toLowerCase().includes(value.toLowerCase()) ||
      item.company.includes(value) ||
      item.recipient.includes(value) ||
      item.phone.includes(value) ||
      item.address.includes(value)
    );
    setFilteredData(filtered);
  };

  // 按快递公司分类
  const handleCompanyFilter = (company: string) => {
    if (company === '全部') {
      setFilteredData(data);
      setSearchValue('');
      return;
    }

    const filtered = data.filter(item => item.company === company);
    setFilteredData(filtered);
    setSearchValue(`快递公司: ${company}`);
  };

  // 编辑记录
  const handleEdit = (record: ExpressData) => {
    setEditingRecord(record);
    form.setFieldsValue({
      recipient: record.recipient,
      phone: record.phone,
      address: record.address,
      status: record.status
    });
    setDrawerVisible(true);
  };

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        const updatedData = data.map(item => {
          if (item.key === editingRecord.key) {
            return {
              ...item,
              ...values
            };
          }
          return item;
        });

        setData(updatedData);

        // 更新过滤后的数据
        const updatedFilteredData = filteredData.map(item => {
          if (item.key === editingRecord.key) {
            return {
              ...item,
              ...values
            };
          }
          return item;
        });
        setFilteredData(updatedFilteredData);

        message.success('保存成功');
        setDrawerVisible(false);
        setEditingRecord(null);
        form.resetFields();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 获取快递公司统计
  const getCompanyStats = () => {
    const stats: { [key: string]: number } = {};
    data.forEach(item => {
      stats[item.company] = (stats[item.company] || 0) + 1;
    });
    return stats;
  };

  // 表格列配置
  const columns = [
    {
      title: '序号',
      dataIndex: 'rowIndex',
      key: 'rowIndex',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '来源列',
      dataIndex: 'columnName',
      key: 'columnName',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 180,
      render: (text: string) => <Text code style={{ fontSize: '12px' }}>{text}</Text>,
    },
    {
      title: '快递公司',
      dataIndex: 'company',
      key: 'company',
      width: 120,
      render: (company: string) => {
        if (!company) {
          return <Text type="secondary">-</Text>;
        }
        const colors: { [key: string]: string } = {
          '顺丰': 'gold',
          '申通': 'lime',
          '圆通': 'green',
          '中通': 'cyan',
          '韵达': 'blue',
          '德邦': 'geekblue',
          '邮政EMS': 'purple',
          '京东': 'magenta',
          '天天': 'red',
          '百世': 'volcano',
        };
        return <Tag color={colors[company] || 'default'}>{company}</Tag>;
      },
    },
    {
      title: '收件人',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 100,
      render: (text: string) => text || <Text type="secondary">未填写</Text>,
    },
    {
      title: '电话号码',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text: string) => text || <Text type="secondary">未填写</Text>,
    },
    {
      title: '家庭住址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (text: string) => text || <Text type="secondary">未填写</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === '已完成' ? 'success' :
          status === '处理中' ? 'processing' :
            status === '待处理' ? 'default' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: ExpressData) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  const companyStats = getCompanyStats();

  return (
    <div
      id="page-container"
      style={{
        padding: '24px',
        minHeight: '100vh',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}
    >
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }} id="page-top">
          <FileExcelOutlined /> 在仓问题件管理系统
        </Title>

        {/* 文件上传区域 */}
        <Card style={{ marginBottom: '24px' }} title="上传在仓问题件.xls文件"
          extra={
            <Space>
              <Button
                type="default"
                onClick={loadDefaultExcelData}
                loading={loading}
                icon={<FileExcelOutlined />}
              >
                重新加载默认数据
              </Button>
              <CreateSampleData />
            </Space>
          }>
          <Alert
            message="系统提示"
            description="页面已自动加载 public/在仓问题件.xls 文件作为默认数据。您可以上传新的Excel文件来替换当前数据，或点击右上角按钮重新加载默认数据。"
            type="info"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
          <Dragger {...uploadProps} style={{ padding: '20px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 .xlsx 和 .xls 格式文件。系统会自动识别快递单号并分类。
            </p>
          </Dragger>
        </Card>

        {/* 快递公司统计 */}
        {data.length > 0 && (
          <Card style={{ marginBottom: '24px' }} title="快递公司分布">
            <Space wrap>
              <Button
                onClick={() => handleCompanyFilter('全部')}
                type={searchValue === '' ? 'primary' : 'default'}
              >
                全部 ({data.length})
              </Button>
              {Object.entries(companyStats).map(([company, count]) => (
                <Button
                  key={company}
                  onClick={() => handleCompanyFilter(company)}
                  type={searchValue.includes(company) ? 'primary' : 'default'}
                >
                  {company} ({count})
                </Button>
              ))}
            </Space>
          </Card>
        )}

        {/* 搜索区域 */}
        {data.length > 0 && (
          <Card style={{ marginBottom: '24px' }} title="搜索快递">
            <Search
              placeholder="输入快递单号、收件人、电话或地址进行搜索"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
              style={{ marginBottom: '16px' }}
            />
            {searchValue && (
              <Text type="secondary">
                搜索条件: {searchValue} | 找到 {filteredData.length} 条结果
              </Text>
            )}
          </Card>
        )}

        {/* 数据表格 */}
        {data.length > 0 && (
          <Card title={`快递信息列表 (${filteredData.length}/${data.length})`}>
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              pagination={{
                total: filteredData.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total: number, range: [number, number]) =>
                  `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
              }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          </Card>
        )}
      </Card>

      {/* 编辑抽屉 */}
      <Drawer
        title="编辑快递信息"
        placement="right"
        onClose={() => {
          setDrawerVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        open={drawerVisible}
        width={400}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            保存
          </Button>
        }
      >
        {editingRecord && (
          <Form
            form={form}
            layout="vertical"
          >
            <div style={{ marginBottom: '16px' }}>
              <Text strong>快递单号：</Text>
              <div>
                <Text code>{editingRecord.trackingNumber}</Text>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>来源列：</Text>
              <Tag color="blue">{editingRecord.columnName}</Tag>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>快递公司：</Text>
              {editingRecord.company ? (
                <Tag color="green">{editingRecord.company}</Tag>
              ) : (
                <Text type="secondary">未识别</Text>
              )}
            </div>

            <Form.Item
              name="recipient"
              label="收件人"
              rules={[{ required: true, message: '请输入收件人姓名' }]}
            >
              <Input placeholder="请输入收件人姓名" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="电话号码"
              rules={[
                { required: true, message: '请输入电话号码' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
              ]}
            >
              <Input placeholder="请输入手机号码" />
            </Form.Item>

            <Form.Item
              name="address"
              label="家庭住址"
              rules={[{ required: true, message: '请输入家庭住址' }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入详细的家庭住址"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="处理状态"
              rules={[{ required: true, message: '请选择处理状态' }]}
            >
              <Select
                style={{ width: '100%' }}
                placeholder="请选择处理状态"
                options={[
                  { label: '待处理', value: '待处理' },
                  { label: '处理中', value: '处理中' },
                  { label: '已完成', value: '已完成' },
                ]}
                defaultValue={editingRecord.status}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>

      {/* 回到顶部按钮 */}
      <FloatButton.BackTop
        style={{ right: 24, bottom: 24 }}
        icon={<UpOutlined />}
        tooltip="回到顶部"
        target={() => window}
        visibilityHeight={100}
      />
    </div>
  );
};

export default ExpressQuery;

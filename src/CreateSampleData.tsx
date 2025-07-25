import React from 'react';
import { Button, Space, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const CreateSampleData: React.FC = () => {
  // 生成示例快递数据 - 基于public/快递数据.xlsx的真实格式
  const createSampleData = () => {
    // 表头行 - 与导出格式完全一致
    const headers = [
      '序号', '快递批次', '快递单号', '快递公司', 
      '类型', '状态', '到仓时间', '发出时间', '收件人', '电话号码', '家庭住址'
    ];

    // 示例数据 - 模拟真实快递数据
    const sampleDataRows = [
      // 第一个批次数据
      [1, '示例批次1', '75761365043766', '中通', '正常', '已发出', '2024-01-15', '2024-01-16', '张三', '13800138001', '北京市朝阳区xxx街道xxx号'],
      [2, '示例批次1', '77632957076153', '申通', '名字错误', '滞留仓库', '2024-01-15', '', '李四', '13800138002', '上海市浦东新区xxx路xxx号'],
      [3, '示例批次1', 'YT894185215852', '圆通', '正常', '已送达', '2024-01-16', '2024-01-17', '王五', '13800138003', '广州市天河区xxx大道xxx号'],
      [4, '示例批次1', '46334069260168', '韵达', '正常', '处理中', '2024-01-16', '', '赵六', '13800138004', '深圳市南山区xxx街xxx号'],
      [5, '示例批次1', '98574940403', '', '正常', '待处理', '2024-01-17', '', '钱七', '13800138005', '杭州市西湖区xxx路xxx号'],
      
      // 第二个批次数据
      [6, '示例批次2', '75761370314853', '中通', '正常', '已发出', '2024-01-20', '2024-01-21', '孙八', '13800138006', '南京市鼓楼区xxx街道xxx号'],
      [7, '示例批次2', '77716951501759', '申通', '正常', '已送达', '2024-01-20', '2024-01-22', '周九', '13800138007', '武汉市武昌区xxx路xxx号'],
      [8, '示例批次2', 'YT893990509270', '圆通', '名字错误', '滞留仓库', '2024-01-21', '', '吴十', '13800138008', '成都市锦江区xxx大道xxx号'],
      [9, '示例批次2', '31866359263298', '韵达', '正常', '已发出', '2024-01-21', '2024-01-23', '郑一', '13800138009', '重庆市渝中区xxx街xxx号'],
      [10, '示例批次2', '9859804263924', '德邦', '正常', '处理中', '2024-01-22', '', '陈二', '13800138010', '西安市雁塔区xxx路xxx号']
    ];

    return [headers, ...sampleDataRows];
  };

  // 创建多个工作表的示例数据
  const createMultiSheetSampleData = () => {
    const headers = [
      '序号', '快递批次', '快递单号', '快递公司', 
      '类型', '状态', '到仓时间', '发出时间', '收件人', '电话号码', '家庭住址'
    ];

    // 第一个工作表数据
    const batch1Data = [
      headers,
      [1, '2024-01', '75761365043766', '中通', '正常', '已发出', '2024-01-15', '2024-01-16', '张三', '13800138001', '北京市朝阳区xxx街道xxx号'],
      [2, '2024-01', '77632957076153', '申通', '名字错误', '滞留仓库', '2024-01-15', '', '李四', '13800138002', '上海市浦东新区xxx路xxx号'],
      [3, '2024-01', 'YT894185215852', '圆通', '正常', '已送达', '2024-01-16', '2024-01-17', '王五', '13800138003', '广州市天河区xxx大道xxx号'],
      [4, '2024-01', '46334069260168', '韵达', '正常', '处理中', '2024-01-16', '', '赵六', '13800138004', '深圳市南山区xxx街xxx号'],
      [5, '2024-01', '98574940403', '', '正常', '待处理', '2024-01-17', '', '钱七', '13800138005', '杭州市西湖区xxx路xxx号']
    ];

    // 第二个工作表数据
    const batch2Data = [
      headers,
      [1, '2024-02', '75761370314853', '中通', '正常', '已发出', '2024-02-01', '2024-02-02', '孙八', '13800138006', '南京市鼓楼区xxx街道xxx号'],
      [2, '2024-02', '77716951501759', '申通', '正常', '已送达', '2024-02-01', '2024-02-03', '周九', '13800138007', '武汉市武昌区xxx路xxx号'],
      [3, '2024-02', 'YT893990509270', '圆通', '名字错误', '滞留仓库', '2024-02-02', '', '吴十', '13800138008', '成都市锦江区xxx大道xxx号'],
      [4, '2024-02', '31866359263298', '韵达', '正常', '已发出', '2024-02-02', '2024-02-04', '郑一', '13800138009', '重庆市渝中区xxx街xxx号'],
      [5, '2024-02', '9859804263924', '德邦', '正常', '处理中', '2024-02-03', '', '陈二', '13800138010', '西安市雁塔区xxx路xxx号']
    ];

    return {
      '2024-01': batch1Data,
      '2024-02': batch2Data
    };
  };

  // 下载示例Excel文件
  const downloadSampleExcel = () => {
    try {
      // 创建多工作表示例数据
      const multiSheetData = createMultiSheetSampleData();
      const wb = XLSX.utils.book_new();
      
      // 为每个批次创建工作表
      Object.entries(multiSheetData).forEach(([sheetName, sheetData]) => {
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        
        // 设置列宽 - 根据实际内容调整
        const wscols = [
          { wch: 8 },   // 序号
          { wch: 15 },  // 快递批次
          { wch: 20 },  // 快递单号
          { wch: 12 },  // 快递公司
          { wch: 10 },  // 类型
          { wch: 12 },  // 状态
          { wch: 15 },  // 到仓时间
          { wch: 15 },  // 发出时间
          { wch: 12 },  // 收件人
          { wch: 15 },  // 电话号码
          { wch: 30 }   // 家庭住址
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      
      // 生成文件名
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 10);
      const filename = `快递数据示例_${timestamp}.xlsx`;
      
      XLSX.writeFile(wb, filename);
      message.success(`示例Excel文件 "${filename}" 已下载！包含 ${Object.keys(multiSheetData).length} 个工作表`);
    } catch (error) {
      message.error('生成示例文件失败');
      console.error('Error creating sample file:', error);
    }
  };

  return (
    <Space>
      <Button 
        type="primary" 
        icon={<DownloadOutlined />} 
        onClick={downloadSampleExcel}
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold'
        }}
      >
        下载示例Excel模板
      </Button>
    </Space>
  );
};

export default CreateSampleData;

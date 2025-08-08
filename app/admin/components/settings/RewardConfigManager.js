import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff, FaCopy } from 'react-icons/fa';
import Swal from 'sweetalert2';
import adminAPI from '../../../lib/admin_api';

const RewardConfigManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('rates');
  const [rewardRates, setRewardRates] = useState([]);
  const [rewardConfigs, setRewardConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2568');
  const [years, setYears] = useState([]); // เปลี่ยนจาก hardcode เป็น array ว่าง
  
  // State for forms
  const [showRateForm, setShowRateForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);

  // Form data
  const [rateFormData, setRateFormData] = useState({
    year: '2568',
    author_status: '',
    journal_quartile: '',
    reward_amount: ''
  });

  const [configFormData, setConfigFormData] = useState({
    year: '2568',
    journal_quartile: '',
    max_amount: '',
    condition_description: ''
  });

  // Author status options
  const authorStatusOptions = [
    { value: 'first_author', label: 'First Author (ผู้นิพนธ์หลัก)' },
    { value: 'corresponding_author', label: 'Corresponding Author (ผู้นิพนธ์ติดต่อ)' },
  ];

  // Quartile options with sort order
  const quartileOptions = [
    { value: 'T5', label: 'T5 (Top 5%)', order: 1 },
    { value: 'T10', label: 'T10 (Top 10%)', order: 2 },
    { value: 'Q1', label: 'Q1 (Quartile 1)', order: 3 },
    { value: 'Q2', label: 'Q2 (Quartile 2)', order: 4 },
    { value: 'Q3', label: 'Q3 (Quartile 3)', order: 5 },
    { value: 'Q4', label: 'Q4 (Quartile 4)', order: 6 },
    { value: 'TCI', label: 'TCI (TCI Group 1)', order: 7 },
    { value: 'N/A', label: 'N/A (ไม่ระบุ)', order: 8 }
  ];

  // Load available years from database
  const loadAvailableYears = async () => {
    try {
      // ดึงปีจากทั้ง 2 tables
      const [ratesResponse, configsResponse] = await Promise.all([
        adminAPI.getPublicationRewardRatesYears().catch(() => ({ years: [] })),
        adminAPI.getRewardConfigYears().catch(() => ({ years: [] }))
      ]);

      // รวมปีจากทั้ง 2 แหล่งและ unique
      const rateYears = ratesResponse.years || [];
      const configYears = configsResponse.years || [];
      const allYears = [...new Set([...rateYears, ...configYears])];
      
      // เรียงปีจากมากไปน้อย (ปีล่าสุดขึ้นก่อน)
      const sortedYears = allYears.sort((a, b) => b - a);
      
      console.log('Available years:', sortedYears);
      setYears(sortedYears);
      
      // ถ้ามีปีในระบบ ให้เลือกปีล่าสุด
      if (sortedYears.length > 0) {
        setSelectedYear(sortedYears[0]);
      }
    } catch (error) {
      console.error('Error loading years:', error);
      // ถ้าโหลดไม่ได้ ใช้ปีปัจจุบัน
      const currentYear = (new Date().getFullYear() + 543).toString();
      setYears([currentYear]);
      setSelectedYear(currentYear);
    }
  };

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear && years.length > 0) {
      loadData();
    }
  }, [selectedYear, activeSubTab, years]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'rates') {
        const response = await adminAPI.getPublicationRewardRates(selectedYear);
        setRewardRates(response.rates || []);
      } else {
        const response = await adminAPI.getRewardConfigs(selectedYear);
        console.log('Config API response:', response);
        // แก้จาก response.configs เป็น response.data
        setRewardConfigs(response.data || []);  // ⬅️ แก้ตรงนี้
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
    }
    setLoading(false);
  };

  // Toggle active status
  const toggleStatus = async (id, currentStatus, type) => {
    const result = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ?',
      text: `ต้องการ${currentStatus ? 'ปิด' : 'เปิด'}การใช้งานรายการนี้?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        if (type === 'rate') {
          await adminAPI.togglePublicationRewardRateStatus(id);
        } else {
          await adminAPI.toggleRewardConfigStatus(id);
        }
        await loadData();
        Swal.fire('สำเร็จ', 'เปลี่ยนสถานะเรียบร้อย', 'success');
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
      }
    }
  };

  // Delete item
  const deleteItem = async (id, type) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'การลบนี้ไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        if (type === 'rate') {
          await adminAPI.deletePublicationRewardRate(id);
        } else {
          await adminAPI.deleteRewardConfig(id);
        }
        await loadData();
        Swal.fire('สำเร็จ', 'ลบข้อมูลเรียบร้อย', 'success');
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    }
  };

  // Save Rate
  const saveRate = async () => {
    try {
      // แปลง reward_amount เป็น number ก่อนส่ง
      const dataToSend = {
        ...rateFormData,
        reward_amount: parseFloat(rateFormData.reward_amount)
      };
      
      if (editingRate) {
        await adminAPI.updatePublicationRewardRate(editingRate.rate_id, dataToSend);
      } else {
        await adminAPI.createPublicationRewardRate(dataToSend);
      }
      setShowRateForm(false);
      setEditingRate(null);
      setRateFormData({
        year: selectedYear,
        author_status: '',
        journal_quartile: '',
        reward_amount: ''
      });
      await loadData();
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  // Save Config
  const saveConfig = async () => {
    try {
      // แปลง max_amount เป็น number ก่อนส่ง
      const dataToSend = {
        ...configFormData,
        max_amount: parseFloat(configFormData.max_amount)
      };
      
      if (editingConfig) {
        await adminAPI.updateRewardConfig(editingConfig.config_id, dataToSend);
      } else {
        await adminAPI.createRewardConfig(dataToSend);
      }
      setShowConfigForm(false);
      setEditingConfig(null);
      setConfigFormData({
        year: selectedYear,
        journal_quartile: '',
        max_amount: '',
        condition_description: ''
      });
      await loadData();
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  };

  // Copy to new year
  const copyToNewYear = async () => {
    const { value: newYear } = await Swal.fire({
      title: 'คัดลอกข้อมูลไปยังปีใหม่',
      input: 'text',
      inputLabel: 'ระบุปีปลายทาง (พ.ศ.)',
      inputPlaceholder: 'เช่น 2569',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'กรุณาระบุปี';
        if (!/^\d{4}$/.test(value)) return 'กรุณาระบุปีในรูปแบบ พ.ศ. 4 หลัก';
        if (parseInt(value) < 2500) return 'ปีต้องมากกว่า 2500';
        if (years.includes(value)) return 'ปีนี้มีข้อมูลอยู่แล้ว';
      }
    });

    if (newYear) {
      try {
        if (activeSubTab === 'rates') {
          await adminAPI.copyPublicationRewardRates(selectedYear, newYear);
        } else {
          await adminAPI.copyRewardConfigs(selectedYear, newYear);
        }
        Swal.fire('สำเร็จ', `คัดลอกข้อมูลไปยังปี ${newYear} เรียบร้อย`, 'success');
        
        // Reload years และเปลี่ยนไปยังปีใหม่
        await loadAvailableYears();
        setSelectedYear(newYear);
      } catch (error) {
        Swal.fire('Error', 'ไม่สามารถคัดลอกข้อมูลได้', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">จัดการเงินรางวัลการตีพิมพ์</h2>
        <p className="text-gray-600 mt-2">กำหนดอัตราเงินรางวัลและวงเงินสนับสนุนค่าธรรมเนียม</p>
      </div>

      {/* Year Selector */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">ปีงบประมาณ:</label>
          {years.length > 0 ? (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>พ.ศ. {year}</option>
              ))}
            </select>
          ) : (
            <span className="text-gray-500">กำลังโหลด...</span>
          )}
        </div>
        {years.length > 0 && (
          <button
            onClick={copyToNewYear}
            className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            <FaCopy className="mr-2" />
            คัดลอกไปปีใหม่
          </button>
        )}
      </div>

      {/* Sub Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('rates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'rates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            อัตราเงินรางวัล (Reward Rates)
          </button>
          <button
            onClick={() => setActiveSubTab('configs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'configs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            วงเงินค่าธรรมเนียม (Fee Limits)
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-t-blue-600"></div>
        </div>
      ) : (
        <>
          {activeSubTab === 'rates' ? (
            // Reward Rates Tab
            <div>
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowRateForm(true);
                    setEditingRate(null);
                    setRateFormData({
                      year: selectedYear,
                      author_status: '',
                      journal_quartile: '',
                      reward_amount: ''
                    });
                  }}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <FaPlus className="mr-2" />
                  เพิ่มอัตราใหม่
                </button>
              </div>

              {/* Rates Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะผู้นิพนธ์
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quartile
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนเงินรางวัล
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewardRates
                      .sort((a, b) => {
                        const orderA = quartileOptions.find(q => q.value === a.journal_quartile)?.order || 999;
                        const orderB = quartileOptions.find(q => q.value === b.journal_quartile)?.order || 999;
                        if (orderA !== orderB) return orderA - orderB;
                        return a.author_status.localeCompare(b.author_status);
                      })
                      .map((rate) => (
                        <tr key={rate.rate_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {authorStatusOptions.find(s => s.value === rate.author_status)?.label || rate.author_status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quartileOptions.find(q => q.value === rate.journal_quartile)?.label || rate.journal_quartile}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {new Intl.NumberFormat('th-TH').format(rate.reward_amount)} บาท
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleStatus(rate.rate_id, rate.is_active, 'rate')}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                rate.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {rate.is_active ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                              {rate.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingRate(rate);
                                setRateFormData({
                                  year: rate.year,
                                  author_status: rate.author_status,
                                  journal_quartile: rate.journal_quartile,
                                  reward_amount: rate.reward_amount
                                });
                                setShowRateForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteItem(rate.rate_id, 'rate')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Fee Configs Tab
            <div>
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowConfigForm(true);
                    setEditingConfig(null);
                    setConfigFormData({
                      year: selectedYear,
                      journal_quartile: '',
                      max_amount: '',
                      condition_description: ''
                    });
                  }}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <FaPlus className="mr-2" />
                  เพิ่มการกำหนดค่าใหม่
                </button>
              </div>

              {/* Configs Table */}
              <div className="overflow-x-auto">
                {/* Debug: แสดงข้อมูลที่ได้มา */}
                {console.log('Rendering configs:', rewardConfigs)}
                {console.log('Configs length:', rewardConfigs.length)}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quartile
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วงเงินสูงสุด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เงื่อนไข/หมายเหตุ
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewardConfigs
                      .sort((a, b) => {
                        const orderA = quartileOptions.find(q => q.value === a.journal_quartile)?.order || 999;
                        const orderB = quartileOptions.find(q => q.value === b.journal_quartile)?.order || 999;
                        return orderA - orderB;
                      })
                      .map((config) => (
                        <tr key={config.config_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quartileOptions.find(q => q.value === config.journal_quartile)?.label || config.journal_quartile}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {config.max_amount > 0 
                              ? `${new Intl.NumberFormat('th-TH').format(config.max_amount)} บาท`
                              : 'ไม่สนับสนุน'
                            }
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {config.condition_description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleStatus(config.config_id, config.is_active, 'config')}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                config.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {config.is_active ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                              {config.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingConfig(config);
                                setConfigFormData({
                                  year: config.year,
                                  journal_quartile: config.journal_quartile,
                                  max_amount: config.max_amount,
                                  condition_description: config.condition_description || ''
                                });
                                setShowConfigForm(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteItem(config.config_id, 'config')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rate Form Modal */}
      {showRateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingRate ? 'แก้ไขอัตราเงินรางวัล' : 'เพิ่มอัตราเงินรางวัล'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะผู้นิพนธ์
                </label>
                <select
                  value={rateFormData.author_status}
                  onChange={(e) => setRateFormData({...rateFormData, author_status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">เลือกสถานะ</option>
                  {authorStatusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal Quartile
                </label>
                <select
                  value={rateFormData.journal_quartile}
                  onChange={(e) => setRateFormData({...rateFormData, journal_quartile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">เลือก Quartile</option>
                  {quartileOptions.map(quartile => (
                    <option key={quartile.value} value={quartile.value}>
                      {quartile.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนเงินรางวัล (บาท)
                </label>
                <input
                  type="number"
                  value={rateFormData.reward_amount}
                  onChange={(e) => setRateFormData({...rateFormData, reward_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRateForm(false);
                  setEditingRate(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveRate}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Form Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingConfig ? 'แก้ไขวงเงินค่าธรรมเนียม' : 'เพิ่มวงเงินค่าธรรมเนียม'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal Quartile
                </label>
                <select
                  value={configFormData.journal_quartile}
                  onChange={(e) => setConfigFormData({...configFormData, journal_quartile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">เลือก Quartile</option>
                  {quartileOptions.map(quartile => (
                    <option key={quartile.value} value={quartile.value}>
                      {quartile.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วงเงินสูงสุด (บาท)
                </label>
                <input
                  type="number"
                  value={configFormData.max_amount}
                  onChange={(e) => setConfigFormData({...configFormData, max_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="1000"
                  placeholder="0 = ไม่สนับสนุนค่าธรรมเนียม"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  ใส่ 0 หากไม่ต้องการสนับสนุนค่าธรรมเนียมสำหรับ Quartile นี้
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เงื่อนไข/หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  value={configFormData.condition_description}
                  onChange={(e) => setConfigFormData({...configFormData, condition_description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="เช่น เงื่อนไขพิเศษสำหรับ Quartile นี้"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfigForm(false);
                  setEditingConfig(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveConfig}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardConfigManager;
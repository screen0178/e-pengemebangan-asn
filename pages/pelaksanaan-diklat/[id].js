/* eslint-disable no-unused-vars */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-else-return */
import { createRef, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import {
  Card,
  Button,
  Form,
  Spin,
  Input,
  Space,
  Select,
  message,
  Table,
  Tag,
  Row,
  Col,
  DatePicker,
  Cascader,
} from 'antd';
import AppLayout from 'layouts/app-layout';
import DiklatService from 'services/DiklatService';
import dayjs from 'dayjs';
import QueryString from 'qs';
import PropTypes from 'prop-types';
import PnsService from 'services/PnsService';
import { ROW_GUTTER } from 'constants/ThemeConstant';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import Cookies from 'utils/Cookies';
import axios from 'axios';

export async function getServerSideProps({ query, ...ctx }) {
  const { id } = query;
  let data = {};
  let diklats = [];
  let diklatList = [];
  try {
    const { API_URL } = process.env;
    const token = Cookies.getData('token', ctx);
    const res = await axios.get(`${API_URL}/api/diklat/pelaksanaan/${id}`, { params: { perPage: 1000 },
      headers: {
        Authorization: `Bearer ${token}`,
      } });
    if (res.status === 200) data = res.data.data;
    const diklat = await axios.get(`${API_URL}/api/master/diklat`, { params: { perPage: 1000 },
      headers: {
        Authorization: `Bearer ${token}`,
      } });
    if (diklat.status === 200) {
      diklats = diklat.data.data.data.map((el) => ({ value: el.id, label: el.nama }));
      diklatList = diklat.data.data.data;
      // eslint-disable-next-line no-restricted-syntax
      for (const el of diklatList) {
        if (el.diklat.length > 0) {
          el.diklat = el.diklat.map((val) => ({
            value: val.id,
            label: val.nama,
            children: val.children,
          }));
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  return { props: { data, diklats, diklatList } };
}

function MasterDataDiklatCreate({ data, diklats, diklatList }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const formRef = createRef();
  const [loading, setLoading] = useState(false);
  const [Edit, setEdit] = useState(true);
  const query = QueryString.parse(window.location.search.split('?')[1]);
  const [dataPelaksanaan, setDataPelaksanaan] = useState({ submited: false, data: {} });
  const [params, setParams] = useState({
    page: parseInt(query.page, 10) || 1,
    perPage: parseInt(query.perPage, 10) || 10,
    'where[diklat]': data.diklat,
    'where[status]': 'verified',
    'where[OR][0][t_pelaksanaan_diklatId]': 'null',
    'where[OR][1][t_pelaksanaan_diklatId]': router.query.id,
  });
  const [tableData, setTableData] = useState({
    data: [],
    total: null,
  });
  const [selectedCandidate, setSelectedCandidate] = useState([]);
  const [submited, setSubmited] = useState(false);
  const [cascaderOpt, setCascaderOpt] = useState([]);
  const [subKompetensi, setSubKompetensi] = useState([]);

  const fetchData = async () => {
    const res = await PnsService.getAllPengajuanVerif({ params });
    setTableData((prevParam) => ({
      ...prevParam,
      data: res.data.data.data,
      total: res.data.data.meta.total,
    }));
  };

  useEffect(() => {
    const day = dayjs(`${data.tahun}-${data.bulan}`, 'YYYY-MM');
    formRef.current.setFieldsValue({ ...data, jadwalPelaksana: day });
    const diklat = diklatList.filter((el) => el.id === data.diklat)[0];
    setCascaderOpt(diklat.diklat);
  }, []);

  useEffect(() => {
    console.log('REFECTH');
    fetchData(params);
  }, [params]);

  const onBack = () => {
    router.push('/pelaksanaan-diklat');
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      render: (text, record, index) => {
        return (params.page - 1) * params.perPage + 1 + index;
        // return params.page > 1 ? index + (params.perPage * params.page) + 1 : index + 1;
      },
    },
    {
      title: 'NIP',
      dataIndex: 'nip',
      render: (text, record, index) => {
        return record.pegawai_id.nip_baru;
      },
    },
    {
      title: 'Nama',
      dataIndex: 'nama_pegawai',
      render: (text, record, index) => {
        return record.pegawai_id.nama_pegawai;
      },
    },
    {
      title: 'Kompetensi',
      render: (text, record, index) => {
        return record.kompetensi.nama;
      },
    },

    {
      title: 'Status Pengajuan',
      dataIndex: 'status',
      key: 'status',
      render: (text) => {
        if (text === 'submit') {
          return <Tag color='geekblue'>diajukan</Tag>;
        } if (text === 'verified') {
          return <Tag color='green'>diverifikasi</Tag>;
        }
        return <Tag color='red'>ditolak</Tag>;
      },
    },
    {
      title: 'tanggal pengajuan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => dayjs(text).format('DD MMMM YYYY HH:mm'),
    },
  ];

  const onSubmit = async (e) => {
    const { jadwalPelaksanaan, ...rest } = e;
    const body = {
      ...rest,
      bulan: dayjs(jadwalPelaksanaan).month(),
      tahun: dayjs(jadwalPelaksanaan).year(),
    };
    setDataPelaksanaan({ submited: true, data: body });
    setLoading(true);
    setParams((prevParam) => ({
      ...prevParam,
      'where[status]': 'verified',
    }));
    setLoading(false);
  };

  const onPageChange = (page, pageSize) => {
    // router.push('', `?page=${page}&perPage=${pageSize}`, { scroll: false });
    router.push({ pathname: '',
      query: {
        id: router.query.id,
      } }, `?page=${page}&perPage=${pageSize}`, { scroll: false });
    setParams((prevParam) => ({
      ...prevParam,
      page,
      perPage: pageSize,
    }));
  };

  const rowSelection = {
    type: 'checkbox',
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedCandidate(selectedRows);
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    getCheckboxProps: (record) => {
      return {
        disabled: selectedCandidate.length === parseInt(dataPelaksanaan?.data?.kuota, 10) && selectedCandidate.filter((el) => el.id === record.id) < 1,
        // Column configuration not to be checked
        name: record.name,
      };
    },
  };

  const onSbmitCandidate = async (e) => {
    setLoading(true);
    const body = {
      ...dataPelaksanaan.data,
      subdiklat: subKompetensi[0],
      subdiklatChild: subKompetensi[1] || '',
    };
    delete body.jadwalPelaksana;
    const pelaksanaanDiklat = await DiklatService.updatePelaksanaanDiklat(router.query.id, body);
    if (pelaksanaanDiklat.status !== 200) return message.error('terjadi masalah pada server2');
    const updateCandidate = await PnsService.updateCandidatePengajuanFromEdit({ datas: selectedCandidate, id: pelaksanaanDiklat.data.data.id });
    if (updateCandidate.status !== 200) return message.error('Terjadi kesalahan pada server1');
    // setSubmited(true);
    setLoading(false);
    return router.push('/pelaksanaan-diklat');
  };

  const handleChangeSubKompetensi = (value) => {
    setSubKompetensi(value);
    console.log('selected', value);
  };

  const onChangeDiklat = (value) => {
    setSubKompetensi([]);
    form.setFieldValue('subDiklat', []);
    const diklat = diklatList.filter((el) => el.id === value)[0];
    setCascaderOpt(diklat.diklat);
  };

  return (
    <Row gutter={ROW_GUTTER}>
      <Col span={24}>
        <div className='d-flex align-items-center justify-content-end'>
          <Button
            type='primary'
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: 5 }}
            onClick={() => router.back()}
          >
            Kembali
          </Button>
          <Button
            type={!Edit ? 'danger' : 'primary'}
            icon={<EditOutlined />}
            style={{ marginRight: 5 }}
            onClick={() => setEdit(!Edit)}
          >
            {!Edit ? 'Batal' : 'Edit'}
          </Button>

        </div>
      </Col>
      <Col span={24}>
        <Card>
          <Spin spinning={loading}>
            <Form ref={formRef} form={form} layout='vertical' onFinish={onSubmit}>
              <Form.Item
                name='nama'
                label={t('Nama Diklat')}
              >
                <Input style={{ color: 'black' }} disabled={Edit} placeholder={t('placeholder:enter', { field: t('Nama Diklat') })} />
              </Form.Item>
              <Form.Item
                label='Kompetensi diklat'
                name='diklat'
                rules={[
                  { required: true },
                ]}
              >
                <Select
                  options={diklats}
                  onChange={onChangeDiklat}
                  disabled={Edit}
                />
              </Form.Item>
              <Form.Item
                name='subDiklat'
              >
                <Cascader
                  onChange={handleChangeSubKompetensi}
                  disabled={cascaderOpt.length === 0 || Edit}
                  style={{ width: '100%' }}
                  placeholder='Pilih Sub'
                  options={cascaderOpt}
                />
              </Form.Item>
              <Form.Item
                name='pagu'
                label='Pagu'
                rules={[{ required: true }]}
              >
                <Input style={{ color: 'black' }} disabled={Edit} type='number' placeholder='1000000' />
              </Form.Item>
              <Form.Item
                name='kuota'
                label='Kuota Diklat'
                rules={[{ required: true }]}
              >
                <Input style={{ color: 'black' }} disabled={Edit} type='number' placeholder='10' />
              </Form.Item>
              <Form.Item
                name='jadwalPelaksana'
                label='Jadwal Pelaksanaan'
                rules={[{ required: true }]}
              >
                <DatePicker disabled={Edit} picker='month' />
              </Form.Item>
              <Form.Item className='mb-0'>
                <Space size='middle'>
                  <Button type='primary' htmlType='submit' disabled={Edit}>
                    Update Table
                  </Button>
                  <Button type='default' onClick={onBack} disabled={Edit}>
                    {t('button:cancel')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
        {data?.id ? (
          <Card title='List Kandidat'>
            {!Edit && dataPelaksanaan.submited
              ? (
                <Table
                  loading={loading}
                  columns={columns}
                  dataSource={tableData.data}
                  rowSelection={rowSelection}
                  rowKey={(record) => record.id}
                  scroll={{ x: 700 }}
                  pagination={{
                    total: tableData.total,
                    showTotal: (total, range) => t('placeholder:pagination', { start: range[0], end: range[1], total }),
                    current: params.page,
                    pageSize: params.perPage,
                    onChange: onPageChange,
                  }}
                />
              )
              : (
                <Table
                  loading={loading}
                  columns={columns}
                  dataSource={data.t_pns_diajukan}
                  rowKey={(record) => record.id}
                  scroll={{ x: 700 }}
                  pagination={false}
                />
              )}
            <Space size='middle' className='mt-4'>
              <Button type='primary' htmlType='submit' onClick={onSbmitCandidate} disabled={submited || selectedCandidate.length === 0}>
                {t('button:submit')}
              </Button>
              <Button type='default' onClick={onBack} disabled={submited}>
                {t('button:cancel')}
              </Button>
            </Space>
          </Card>
        ) : null}
      </Col>
    </Row>
  );
}

MasterDataDiklatCreate.getLayout = function getLayout(page) {
  return (
    <AppLayout title='Buat Diklat Baru' key={1} extra={false} onTab={0}>
      {page}
    </AppLayout>
  );
};

MasterDataDiklatCreate.propTypes = {
  data: PropTypes.object.isRequired,
  diklats: PropTypes.object.isRequired,
  diklatList: PropTypes.array.isRequired,
};

export default MasterDataDiklatCreate;

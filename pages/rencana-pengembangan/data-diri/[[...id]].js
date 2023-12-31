/* eslint-disable no-unused-vars */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-else-return */
import { useSelector } from 'react-redux';
import { useEffect, useState, createRef } from 'react';
import AppLayout from 'layouts/app-layout';
import PropTypes from 'prop-types';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Divider, Empty,
  Radio,
  Cascader,
  InputNumber,
  TreeSelect,
  Switch,
  Checkbox,
  Upload,
} from 'antd';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PnsService from 'services/PnsService';
// eslint-disable-next-line import/no-unresolved
import useDebounce from 'hooks/useDebounce';
import OpdService from 'services/OpdService';
import prisma from 'lib/prisma';
import Cookies from 'utils/Cookies';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;

export async function getServerSideProps({ query, ...ctx }) {
  let opds = [];
  let nomenklaturJabatan = [];
  let dataPengusul = {};
  try {
    const { API_URL } = process.env;
    const token = Cookies.getData('token', ctx);
    if (query.id) {
      dataPengusul = (await axios.get(`${API_URL}/api/pns/pengajuan/${query.id}`, { params: { perPage: 2000 },
        headers: {
          Authorization: `Bearer ${token}`,
        } })).data.data;
    }
    const opd = await axios.get(`${API_URL}/api/master/opd`, { params: { perPage: 2000 },
      headers: {
        Authorization: `Bearer ${token}`,
      } });
    if (opd.status === 200) opds = opd.data.data.data.map((el) => ({ value: el.nomenklatur_pada, label: el.nomenklatur_pada }));
    const jabatan = await prisma.$queryRaw`SELECT DISTINCT nomenklatur_jabatan  FROM r_pegawai_aktual rpa WHERE nomenklatur_jabatan IS NOT NULL AND nomenklatur_jabatan != '-'`;
    if (jabatan.length > 0) {
      nomenklaturJabatan = jabatan.map((el) => ({ value: el.nomenklatur_jabatan, label: el.nomenklatur_jabatan }));
    }
  } catch (err) {
    console.log(err);
  }
  return { props: { opds, nomenklaturJabatan, dataPengusul } };
}

function RencanaPengembangan1({ opds, nomenklaturJabatan, dataPengusul }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const formRef = createRef();
  const { user } = useSelector((state) => state.auth);
  const [jabatan, setJabatan] = useState({
    JPT: false,
    Administrator: false,
    Pengawas: false,
    Fungsional: false,
    Pelaksana: false,
  });
  const [subJabatan, setSubjabatan] = useState('');
  const [jabatanCheck, setJabatanCheck] = useState(false);
  const [jabatan2, setJabatan2] = useState(undefined);
  const [pnsList, setPnsList] = useState({
    data: [],
    raw: [],
    total: null,
  });

  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    'where[nip_baru][contains]': '',
  });
  const debouncedSearchValue = useDebounce(params, 1000);
  const fetchPnsData = async () => {
    setLoading(true);
    const res = await PnsService.getAllPns({ params });
    const list = res.data.data.data.map((el) => ({ value: el.id, label: el.nip_baru }));
    setPnsList((prevParam) => ({
      ...prevParam,
      data: list,
      raw: res.data.data.data,
      total: res.data.data.meta.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    console.log('LIST-PNS');
    fetchPnsData();
  }, [debouncedSearchValue]);

  useEffect(() => {
    if (user.role === 'UMPEG' && user.opd.nama !== 'master') {
      setParams((prevParam) => ({
        ...prevParam,
        'where[nomenklatur_pada]': user.opd.nama,
      }));
    }
    if (Object.keys(dataPengusul).length !== 0) {
      formRef.current.setFieldValue('nip', dataPengusul?.pegawai_id?.nip_baru || '');
      formRef.current.setFieldValue('nama', dataPengusul?.pegawai_id?.nama_pegawai || '');
      formRef.current.setFieldValue('golongan', dataPengusul?.pegawai_id?.nama_golongan || '');
      formRef.current.setFieldValue('pendidikan', dataPengusul?.pegawai_id?.nama_jenjang_rumpun || '');
      formRef.current.setFieldValue('unit_kerja', dataPengusul?.pegawai_id?.nomenklatur_pada || '');
      formRef.current.setFieldValue('jabatan', dataPengusul?.pegawai_id?.jab_type || '');
      formRef.current.setFieldValue('sub_jabatan', dataPengusul?.pegawai_id?.subjabatanType || '');
    }
  }, []);

  const onDetail = (record) => {
    console.log(record);
  };

  const onPageChange = (page, pageSize) => {
    setParams((prevParam) => ({
      ...prevParam,
      page,
      limit: pageSize,
    }));
  };

  const onFormLayoutChange = (value) => {
    console.log('FORM..', value);
  };

  // NAMA SECTION
  const onChangeNama = (value) => {
    console.log(`selected ${value}`);
    const data = pnsList.raw.filter((el) => el.id === value)[0];
    console.log('selected data', data);
    const selectednama = data.nama_pegawai || '';
    const golongan = data.nama_golongan || '';
    const pendidikan = data.nama_jenjang_rumpun || '';
    const unitKerja = data.nomenklatur_pada || '';
    const jabatanType = data.jab_type || '';
    const subjabatanType = data.nomenklatur_jabatan || '';
    formRef.current.setFieldValue('nama', selectednama);
    formRef.current.setFieldValue('golongan', golongan);
    formRef.current.setFieldValue('pendidikan', pendidikan);
    formRef.current.setFieldValue('unit_kerja', unitKerja);
    formRef.current.setFieldValue('jabatan', jabatanType);
    formRef.current.setFieldValue('sub_jabatan', subjabatanType);
    setJabatan2(jabatanType);
  };
  const onSearchNama = (value) => {
    console.log('search:', value);
    setParams((prevParam) => ({
      ...prevParam,
      'where[nip_baru][contains]': value,
    }));
  };
  const filterOptionNama = (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  // PANGKAT SECTION
  const handleChangePangkat = (value) => {
    console.log(`selected ${value}`);
  };

  // UNITKERJA SECTION
  const handleChangeUnitKerja = (value) => {
    console.log(`selected ${value}`);
    setSubjabatan(value);
  };

  const onFinishForm = async (e) => {
    if (Object.keys(dataPengusul).length !== 0) {
      return router.push(`/rencana-pengembangan/diklat/${dataPengusul.id}`);
    }
    console.log(e);
    const pengajuan = await PnsService.createPengajuan({ pegawaiId: e.nip });
    console.log(pengajuan);
    return router.push(`/rencana-pengembangan/diklat/${pengajuan.data.data.id}`);
  };

  const onChangeJabatan2 = (el, evt) => {
    if (evt.target.checked) {
      setJabatan2(el.value);
    } else {
      setJabatan2(undefined);
    }
  };

  const GolonganClassifications = [
    {
      value: 'I/a',
      label: 'I/a - Juru Muda',
    },
    {
      value: 'I/b',
      label: 'I/b - Juru Muda Tingkat I',
    },
    {
      value: 'I/c',
      label: 'I/c - Juru',
    },
    {
      value: 'I/d',
      label: 'I/d - Juru Tingkat I',
    },
    {
      value: 'II/a',
      label: 'II/a - Pengatur Muda',
    },
    {
      value: 'II/b',
      label: 'II/b - Pengatur Muda Tingkat I',
    },
    {
      value: 'II/c',
      label: 'II/c - Pengatur',
    },
    {
      value: 'II/d',
      label: 'II/d - Pengatur Tingkat I',
    },
    {
      value: 'III/a',
      label: 'III/a - Penata Muda',
    },
    {
      value: 'III/b',
      label: 'III/b - Penata Muda Tingkat I',
    },
    {
      value: 'III/c',
      label: 'III/c - Penata',
    },
    {
      value: 'III/d',
      label: 'III/d - Penata Tingkat I',
    },
    {
      value: 'IV/a',
      label: 'IV/a - Pembina',
    },
    {
      value: 'IV/b',
      label: 'IV/b - Pembina Tingkat I',
    },
    {
      value: 'IV/c',
      label: 'IV/c - Pembina Utama Muda',
    },
    {
      value: 'IV/d',
      label: 'IV/d - Pembina Utama Madya',
    },
    {
      value: 'IV/e',
      label: 'IV/e - Pembina Utama',
    },
  ];

  const EducationClassifications = [
    {
      value: 'D-II',
      label: 'D-II',
    },
    {
      value: 'D-III',
      label: 'D-III',
    },
    {
      value: 'D-IV',
      label: 'D-IV',
    },
    {
      value: 'Diploma I',
      label: 'Diploma I',
    },
    {
      value: 'Diploma II',
      label: 'Diploma II',
    },
    {
      value: 'Diploma III',
      label: 'Diploma III',
    },
    {
      value: 'Diploma IV',
      label: 'Diploma IV',
    },
    {
      value: 'S-1',
      label: 'S-1',
    },
    {
      value: 'S-2',
      label: 'S-2',
    },
    {
      value: 'S-3',
      label: 'S-3',
    },
    {
      value: 'Sekolah Dasar',
      label: 'Sekolah Dasar',
    },
    {
      value: 'Sekolah Menegah Pertama',
      label: 'Sekolah Menegah Pertama',
    },
    {
      value: 'Sekolah Menengah Atas',
      label: 'Sekolah Menengah Atas',
    },
  ];

  const JabatanClassifications = [
    { value: 'jf', label: 'Fungsional' },
    { value: 'jfu', label: 'Fungsional Umum/Staff' },
    { value: 'js', label: 'Struktural' },
    { value: 'jftguru', label: 'Fungsional Guru' },
    { value: 'jft', label: 'Fungsional Tertentu' },
  ];

  return (
    <div className='cards-container' style={{ backgroundColor: 'whitesmoke' }}>
      <Row>
        <Col span={24} className='px-4 py-2' style={{ backgroundColor: '#DE0000', color: 'white' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>Pendataan Pengembangan</span>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Card>
            <Form
              ref={formRef}
              form={form}
              layout='vertical'
              onValuesChange={onFormLayoutChange}
              name='basic'
              initialValues={{ remember: true }}
              onFinish={onFinishForm}
              autoComplete='off'
            >
              <Form.Item
                label='Nip'
                name='nip'
                rules={[
                  { required: true },
                ]}
              >
                <Select
                  showSearch
                  placeholder='Select Nip'
                  optionFilterProp='children'
                  onChange={onChangeNama}
                  onSearch={onSearchNama}
                  filterOption={filterOptionNama}
                  options={pnsList.data}
                />
              </Form.Item>
              <Form.Item
                label='Nama'
                name='nama'
                rules={[
                  { required: true },
                ]}
              >
                <Input placeholder='Nama' type='text' />
              </Form.Item>
              <Form.Item
                label='Pangkat/Golongan'
                name='golongan'
                rules={[
                  { required: true },
                ]}
              >
                <Select
                  style={{
                    width: '30%',
                  }}
                  onChange={handleChangePangkat}
                  options={GolonganClassifications}
                />
              </Form.Item>
              <Form.Item
                label='Pendidikan Terakhir'
                name='pendidikan'
                rules={[
                  { required: true },
                ]}
              >
                <Select
                  style={{
                    width: '30%',
                  }}
                  onChange={handleChangePangkat}
                  options={EducationClassifications}
                />
              </Form.Item>
              <Form.Item
                label='Unit Kerja'
                name='unit_kerja'
                rules={[
                  { required: true },
                ]}
              >
                <Select
                  onChange={handleChangeUnitKerja}
                  options={opds}
                />
              </Form.Item>
              <Form.Item
                label='Jabatan'
                name='jabatan'
                rules={[
                  { required: true },
                ]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Col span={24}>
                    {JabatanClassifications
                      ? JabatanClassifications.map((el, idx) => {
                        return (
                          <Row key={idx}>
                            <Checkbox
                              value={el.value}
                              onChange={(e) => onChangeJabatan2(el, e)}
                              disabled={
                                  jabatan2 !== undefined
                                  && jabatan2 !== el.value
                                }
                            >
                              {el.label}
                            </Checkbox>
                            {jabatan2 !== undefined && jabatan2 === el.value && (
                              <Form.Item
                                name='sub_jabatan'
                                rules={[
                                  { required: true },
                                ]}
                                noStyle
                              >

                                <Select
                                  onChange={handleChangeUnitKerja}
                                  placeholder='Pilih Bidang'
                                  options={nomenklaturJabatan}
                                />
                              </Form.Item>
                            )}
                          </Row>
                        );
                      })
                      : null}
                  </Col>
                </Checkbox.Group>

              </Form.Item>
              {/* <Form.Item wrapperCol={{ offset: 8, span: 16 }}> */}
              <Form.Item>
                <Row>
                  <Col span={20}>
                    <div> </div>
                  </Col>
                  <Col span={4}>
                    <Button type='primary' htmlType='submit'>
                      Selanjutnya
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

RencanaPengembangan1.getLayout = function getLayout(page) {
  return (
    <AppLayout title='List PNS' extraDef='rencanaPengembangan' onTab='dataDiri'>
      {page}
    </AppLayout>
  );
};

RencanaPengembangan1.propTypes = {
  opds: PropTypes.array.isRequired,
  nomenklaturJabatan: PropTypes.array.isRequired,
  dataPengusul: PropTypes.object,
};

RencanaPengembangan1.defaultProps = {
  dataPengusul: {},
};

export default RencanaPengembangan1;

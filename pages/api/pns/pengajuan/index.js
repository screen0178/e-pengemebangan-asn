import { decode } from 'jsonwebtoken';
import prisma from 'lib/prisma';
import QueryString from 'qs';

export default async function handler(req, res) {
  const user = decode(req.headers?.authorization?.split(' ')[1]);
  switch (req.method) {
    case 'POST':
      try {
        const { pegawaiId } = req.body;
        if (!pegawaiId) return res.status(403).json({ message: 'Validation error', data: '' });
        const pengajuan = await prisma.t_pns_diajukan.create({
          data: {
            r_pegawai_aktualId: parseInt(pegawaiId, 10),
            status: 'DRAFT',
          },
        });
        return res.status(201).json({ message: 'Pengajuan pns berhasil ditambahkan', data: pengajuan });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Terjadi Kesalahan Pada Server', data: err });
      }
    case 'GET':
      const { page: pages, perPage: perPages } = QueryString.parse(req.query);
      const page = Number(pages || pages) || 1;
      const perPage = Number(perPages || perPages) || 10;
      const skip = page > 0 ? perPage * (page - 1) : 0;
      const where = {
        OR: [
          { status: 'submit' },
          { status: 'verified' },
          { status: 'rejected' },
        ],
      };
      if (user?.role === 'UMPEG' && user?.opd?.nama !== 'master') {
        where.pegawai_id = {
          nomenklatur_pada: user?.opd?.nama,
        };
      }
      const [total, data] = await Promise.all([
        prisma.t_pns_diajukan.count({
          where,
        }),
        prisma.t_pns_diajukan.findMany({
          where,
          take: perPage,
          skip,
          include: {
            pegawai_id: {
              select: {
                nama_pegawai: true,
                nip_baru: true,
                nomenklatur_pada: true,
              },
            },
            kompetensi: {
              select: {
                id: true,
                nama: true,
              },
            },
            keterangan: {
              select: {
                keterangan: true,
                status: true,
                createdAt: true,
              },
            },
            subKompetensi: {
              select: {
                nama: true,
                children: true,
              },
            },
          },
          orderBy: [
            {
              status: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
        }),
      ]);
      const lastPage = Math.ceil(total / perPage);
      const result = {
        data,
        meta: {
          total,
          lastPage,
          currentPage: page,
          perPage,
          prev: page > 1 ? page - 1 : null,
          next: page < lastPage ? page + 1 : null,
        },
      };
      return res.status(200).json({ message: 'Data Berhasil ditemukan', data: result });
    case 'PUT':
      try {
        const { pegawaiId } = req.body;
        if (!pegawaiId) return res.status(403).json({ message: 'Validation error', data: '' });
        const pengajuan = await prisma.t_pns_diajukan.create({
          data: {
            r_pegawai_aktualId: parseInt(pegawaiId, 10),
            status: 'DRAFT',
          },
        });
        return res.status(201).json({ message: 'Pengajuan pns berhasil ditambahkan', data: pengajuan });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Terjadi Kesalahan Pada Server', data: err });
      }
    default:
      return res.status(404).json({ message: 'Not found', data: '' });
  }
}

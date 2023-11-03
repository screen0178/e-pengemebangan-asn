import prisma from 'lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  switch (req.method) {
    case 'GET':
      try {
        const pns = await prisma.t_pelaksanaan_diklat.findUnique({
          where: {
            id,
          },
          include: {
            t_pns_diajukan: {
              include: {
                pegawai_id: {
                  select: {
                    nama_pegawai: true,
                    nip_baru: true,
                  },
                },
                kompetensi: {
                  select: {
                    nama: true,
                  },
                },
              },
            },
            Diklat: {
              select: {
                nama: true,
              },
            },
          },
        });
        return res.status(200).json({ message: 'Data found', data: pns });
      } catch (err) {
        return res.status(500).json({ message: 'Terjadi kesalah pada server', data: err });
      }
    default:
      return res.status(404).json({ message: 'Not found', data: '' });
  }
}

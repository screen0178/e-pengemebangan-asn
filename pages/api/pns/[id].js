import prisma from 'lib/prisma';

export default async function handler(req, res) {
  const { id: idString } = req.query;
  const id = parseInt(idString, 10);
  switch (req.method) {
    case 'GET':
      try {
        const pns = await prisma.r_pegawai_aktual.findUnique({
          where: {
            id,
          },
        });
        if (!pns) return res.status(404).json({ message: 'Data not found', data: pns });
        return res.status(200).json({ message: 'Data found', data: pns });
      } catch (err) {
        return res.status(500).json({ message: 'terjadi kesalahan pada server', data: '' });
      }
    default:
      return res.status(404).json({ message: 'Not found', data: '' });
  }
}

import prisma from 'lib/prisma';
import QueryString from 'qs';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      const { where, orderBy, page: pages, perPage: perPages } = QueryString.parse(req.query);
      const page = Number(pages || pages) || 1;
      const perPage = Number(perPages || perPages) || 10;
      const skip = page > 0 ? perPage * (page - 1) : 0;
      const [total, data] = await Promise.all([
        prisma.r_pegawai_aktual.count({ where }),
        prisma.r_pegawai_aktual.findMany({
          where,
          orderBy,
          take: perPage,
          skip,
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
    default:
      return res.status(404).json({ message: 'Not found', data: '' });
  }
}

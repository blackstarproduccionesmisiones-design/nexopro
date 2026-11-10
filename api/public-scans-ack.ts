interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

export default function handler(_req: unknown, res: VercelRes) {
  res.status(200).json({ ok: true, remaining: 0 });
}

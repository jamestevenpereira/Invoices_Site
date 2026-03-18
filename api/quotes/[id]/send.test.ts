jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-id' }) },
  })),
}));
jest.mock('../../_lib/jwt', () => ({ verifyJwt: jest.fn().mockResolvedValue(true) }));
jest.mock('../../_lib/supabase', () => ({
  createAdminClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: {
        id: 'q1', number: 'ORC-2026-001', client_name: 'Test', client_email: 'c@test.pt',
        status: 'quote', hourly_rate: 15, items: [], notes: '', total_amount: 120,
      },
      error: null,
    }),
    update: jest.fn().mockReturnThis(),
  }),
}));

import handler from './send';

describe('POST /api/quotes/:id/send', () => {
  const makeReq = () => ({
    method: 'POST',
    headers: { authorization: 'Bearer valid-token' },
    query: { id: 'q1' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  it('returns 200 and writes sent_at on success', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 401 when JWT is invalid', async () => {
    const { verifyJwt } = require('../../_lib/jwt');
    (verifyJwt as jest.Mock).mockResolvedValueOnce(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 500 and does NOT write sent_at when email send fails', async () => {
    const { Resend } = require('resend');
    (Resend as jest.Mock).mockImplementationOnce(() => ({
      emails: { send: jest.fn().mockRejectedValue(new Error('Resend error')) },
    }));
    const supabaseMock = require('../../_lib/supabase').createAdminClient();
    supabaseMock.update.mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), end: jest.fn() } as any;
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(supabaseMock.update).not.toHaveBeenCalled();
  });
});

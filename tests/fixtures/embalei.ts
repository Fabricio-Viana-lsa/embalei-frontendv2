import type { ApiEmbalagem, EmbaleiSession } from '@/lib/api'
import type { OperatorStats, ScannedOrder } from '@/types'

export const CHAVE_ACESSO = '35240612345678901234550010000012341000012345'
export const OUTRA_CHAVE_ACESSO = '35240698765432109876550010000098761000098765'

export const SESSION: EmbaleiSession = {
  userId: 7,
  username: 'maria.silva',
  workstationId: 'a1b2c3d4-0000-4000-8000-000000000001',
  workstationName: 'Estação 1',
  heartbeatIntervalSeconds: 120,
}

export const OPERATOR_STATS: OperatorStats = { orderCount: 3, unitCount: 41 }

export const EMBALAGENS: ApiEmbalagem[] = [
  { id: 1, name: 'Caixa P', eanCode: '2000000000017' },
  { id: 2, name: 'Caixa M', eanCode: '2000000000024' },
]

export function buildOrder({
  chaveAcesso = CHAVE_ACESSO,
  numPedido = 'PED-90210',
  alreadyPacked = false,
  isMine = true,
  status = 'open' as 'open' | 'closed',
  busyBy = null as string | null,
  packedBy = null as ScannedOrder['packedBy'],
}: Partial<{
  chaveAcesso: string
  numPedido: string
  alreadyPacked: boolean
  isMine: boolean
  status: 'open' | 'closed'
  busyBy: string | null
  packedBy: ScannedOrder['packedBy']
}> = {}): ScannedOrder {
  return {
    idOrder: '90210',
    numPedido,
    legacyNumPedido: '90210',
    chaveAcesso,
    dataPedido: '2026-08-18',
    customer: 'Cliente Teste',
    orderComments: null,
    itemCount: 2,
    unitCount: 5,
    volumeCount: 2,
    carrier: { name: 'Transportadora Teste', deliveryDate: '2026-08-20' },
    temperature: null,
    labelGifUrl: null,
    alreadyPacked,
    packedBy,
    session: { status, startedAt: '2026-08-18T12:00:00.000Z', isMine, busyBy },
    items: [
      { idSku: 'SKU-1', skuName: 'Produto A', quantity: 3 },
      { idSku: 'SKU-2', skuName: 'Produto B', quantity: 2 },
    ],
    operatorStats: OPERATOR_STATS,
  }
}

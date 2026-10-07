import { expect, type Page, type Route } from '@playwright/test'
import { EMBALAGENS, OPERATOR_STATS, SESSION, buildOrder } from '../fixtures/embalei'
import type { ScannedOrder } from '@/types'

const SESSION_KEY = 'embalei.session'
const EMBALEI_API = '**/api/modulos/embalei/**'
const SCANNER_LABEL = 'Leitor de código (NF-e)'

export interface ApiCall {
  url: string
  method: string
  body: unknown
}

export interface ApiMockOptions {
  order?: ScannedOrder
  orderStatus?: number
  orderError?: string
  finalizeStatus?: number
  finalizeError?: string
}

export interface ApiMock {
  calls: ApiCall[]
  callsTo: ({ path }: { path: string }) => ApiCall[]
  setOrder: ({ order }: { order: ScannedOrder }) => void
}

function jsonResponse({ route, body, status = 200 }: { route: Route; body: unknown; status?: number }) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  })
}

export async function mockEmbaleiApi({
  page,
  options = {},
}: {
  page: Page
  options?: ApiMockOptions
}): Promise<ApiMock> {
  const calls: ApiCall[] = []
  let currentOrder = options.order ?? buildOrder()

  await page.route(EMBALEI_API, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    let body: unknown = null
    try {
      body = request.postDataJSON()
    } catch {
      body = null
    }
    calls.push({ url: url.pathname, method: request.method(), body })

    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'content-type',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        },
      })
    }

    const path = url.pathname

    if (path.endsWith('/estacoes/usuarios')) {
      return jsonResponse({ route, body: { usuarios: [{ id: SESSION.userId, username: SESSION.username }] } })
    }
    if (path.endsWith('/estacoes/embalagens')) {
      return jsonResponse({ route, body: { embalagens: EMBALAGENS } })
    }
    if (path.endsWith('/estacoes/stats')) {
      return jsonResponse({ route, body: OPERATOR_STATS })
    }
    if (path.endsWith('/estacoes/heartbeat')) {
      return jsonResponse({ route, body: { success: true } })
    }
    if (path.endsWith('/estacoes/liberar')) {
      return jsonResponse({ route, body: { success: true } })
    }
    if (path.endsWith('/estacoes/pedidos/finalizar')) {
      if (options.finalizeStatus && options.finalizeStatus >= 400) {
        return jsonResponse({
          route,
          status: options.finalizeStatus,
          body: { error: options.finalizeError ?? 'Falha ao finalizar a embalagem.' },
        })
      }
      return jsonResponse({
        route,
        body: {
          success: true,
          finishedAt: '2026-08-18 12:04:00',
          durationSeconds: 240,
          volumeCount: (body as { volumeCount?: number } | null)?.volumeCount ?? 0,
          operatorStats: { orderCount: OPERATOR_STATS.orderCount + 1, unitCount: OPERATOR_STATS.unitCount + 5 },
        },
      })
    }
    if (path.endsWith('/estacoes/pedidos')) {
      if (options.orderStatus && options.orderStatus >= 400) {
        return jsonResponse({
          route,
          status: options.orderStatus,
          body: { error: options.orderError ?? 'Pedido não encontrado.' },
        })
      }
      const chaveAcesso = (body as { chaveAcesso?: string } | null)?.chaveAcesso
      return jsonResponse({
        route,
        body: chaveAcesso ? { ...currentOrder, chaveAcesso } : currentOrder,
      })
    }
    if (path.endsWith('/estacoes')) {
      return jsonResponse({
        route,
        body: {
          estacoes: [
            {
              id: SESSION.workstationId,
              name: SESSION.workstationName,
              description: null,
              status: 'disponivel',
              occupantName: null,
              occupiedSince: null,
            },
          ],
          heartbeatIntervalSeconds: SESSION.heartbeatIntervalSeconds,
        },
      })
    }

    return jsonResponse({ route, status: 404, body: { error: `Rota não mockada: ${path}` } })
  })

  return {
    calls,
    callsTo: ({ path }) => calls.filter((call) => call.url.endsWith(path)),
    setOrder: ({ order }) => {
      currentOrder = order
    },
  }
}

export async function seedSession({ page }: { page: Page }): Promise<void> {
  await page.goto('/')
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string)
    },
    [SESSION_KEY, JSON.stringify(SESSION)],
  )
}

export async function openEmbalagem({ page }: { page: Page }): Promise<void> {
  await page.goto('/embalagem')
  await expect(page.getByLabel(SCANNER_LABEL)).toBeAttached()
}

export async function bipar({ page, code }: { page: Page; code: string }): Promise<void> {
  const scanner = page.getByLabel(SCANNER_LABEL)
  await scanner.focus()
  await page.keyboard.type(code)
  await page.keyboard.press('Enter')
}

export async function adicionarEmbalagem({
  page,
  name = 'Caixa P',
}: {
  page: Page
  name?: string
}): Promise<void> {
  await page.getByRole('button', { name: 'Abrir teclado de embalagens' }).click()
  await page.getByRole('button', { name: `Adicionar ${name}` }).click()
  await page.getByRole('button', { name: 'Fechar teclado' }).click()
}

export async function readStoredSession({ page }: { page: Page }): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key as string), SESSION_KEY)
}

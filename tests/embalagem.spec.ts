import { expect, test } from '@playwright/test'
import { CHAVE_ACESSO, OUTRA_CHAVE_ACESSO, buildOrder } from './fixtures/embalei'
import {
  adicionarEmbalagem,
  bipar,
  mockEmbaleiApi,
  openEmbalagem,
  readStoredSession,
  seedSession,
} from './support/embalei'

test.describe('Embalagem — bipagem e finalização', () => {
  test('sem sessão salva, volta para o login', async ({ page }) => {
    await mockEmbaleiApi({ page })
    await page.goto('/embalagem')
    await expect(page).toHaveURL(/\/$/)
  })

  test('bipar a chave da NF-e abre o pedido', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })

    await bipar({ page, code: CHAVE_ACESSO })

    await expect(page.getByText('PED-90210').first()).toBeVisible()
    expect(api.callsTo({ path: '/estacoes/pedidos' })).toHaveLength(1)
  })

  test('selecionar embalagens no teclado incrementa e decrementa os volumes', async ({ page }) => {
    await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await page.getByRole('button', { name: 'Abrir teclado de embalagens' }).click()
    await page.getByRole('button', { name: 'Adicionar Caixa P' }).click()
    await page.getByRole('button', { name: 'Adicionar Caixa P' }).click()
    await expect(page.getByLabel('2 adicionada(s)')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Caixa P' }).click()
    await expect(page.getByLabel('1 adicionada(s)')).toBeVisible()
  })

  test('2º bipe da mesma NF-e com volumes finaliza a embalagem', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })
    await adicionarEmbalagem({ page })

    await bipar({ page, code: CHAVE_ACESSO })

    const finalizeCalls = api.callsTo({ path: '/estacoes/pedidos/finalizar' })
    expect(finalizeCalls).toHaveLength(1)
    expect(finalizeCalls[0].body).toMatchObject({
      chaveAcesso: CHAVE_ACESSO,
      volumeCount: 1,
    })
    await expect(page.getByText(/embalado · 1 volume/i)).toBeVisible()
  })

  test('2º bipe da mesma NF-e sem volume não finaliza', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await bipar({ page, code: CHAVE_ACESSO })

    await expect(
      page.getByText('Selecione ao menos uma embalagem utilizada antes de finalizar o pedido.'),
    ).toBeVisible()
    expect(api.callsTo({ path: '/estacoes/pedidos/finalizar' })).toHaveLength(0)
  })

  test('botão Confirmar volumes continua finalizando', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })
    await adicionarEmbalagem({ page })

    await page.getByRole('button', { name: /Confirmar volumes/ }).click()

    expect(api.callsTo({ path: '/estacoes/pedidos/finalizar' })).toHaveLength(1)
    await expect(page.getByText(/embalado · 1 volume/i)).toBeVisible()
  })

  test('bipar outra NF-e com pedido aberto é bloqueado', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await bipar({ page, code: OUTRA_CHAVE_ACESSO })

    await expect(page.getByText('Finalize a embalagem atual antes de bipar outra NF-e.')).toBeVisible()
    expect(api.callsTo({ path: '/estacoes/pedidos' })).toHaveLength(1)
  })

  test('pedido já embalado avisa quem embalou e não finaliza', async ({ page }) => {
    const api = await mockEmbaleiApi({
      page,
      options: {
        order: buildOrder({
          alreadyPacked: true,
          status: 'closed',
          packedBy: { username: 'joao.souza', workstationName: 'Estação 2', scannedAt: '2026-08-18 11:00:00' },
        }),
      },
    })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await expect(page.getByText(/JÁ FOI EMBALADO por joao\.souza/)).toBeVisible()

    await bipar({ page, code: CHAVE_ACESSO })
    expect(api.callsTo({ path: '/estacoes/pedidos/finalizar' })).toHaveLength(0)
  })

  test('pedido aberto por outro operador não pode ser finalizado', async ({ page }) => {
    const api = await mockEmbaleiApi({
      page,
      options: { order: buildOrder({ isMine: false, busyBy: 'joao.souza' }) },
    })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await expect(page.getByText(/em embalagem por joao\.souza/)).toBeVisible()

    await bipar({ page, code: CHAVE_ACESSO })
    expect(api.callsTo({ path: '/estacoes/pedidos/finalizar' })).toHaveLength(0)
  })

  test('código que não é chave de 44 dígitos pede a embalagem no teclado', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })

    await bipar({ page, code: '2000000000017' })

    await expect(page.getByText('Selecione a embalagem do volume no teclado.')).toBeVisible()
    expect(api.callsTo({ path: '/estacoes/pedidos/finalizar' })).toHaveLength(0)
  })

  test('falha ao finalizar mantém o pedido na tela', async ({ page }) => {
    await mockEmbaleiApi({
      page,
      options: { finalizeStatus: 409, finalizeError: 'Nenhuma sessão de embalagem aberta.' },
    })
    await seedSession({ page })
    await openEmbalagem({ page })
    await bipar({ page, code: CHAVE_ACESSO })
    await adicionarEmbalagem({ page })

    await bipar({ page, code: CHAVE_ACESSO })

    await expect(page.getByText('Nenhuma sessão de embalagem aberta.')).toBeVisible()
    await expect(page.getByText('PED-90210').first()).toBeVisible()
  })

  test('sair libera a estação e limpa a sessão', async ({ page }) => {
    const api = await mockEmbaleiApi({ page })
    await seedSession({ page })
    await openEmbalagem({ page })

    await page.getByRole('button', { name: 'SAIR' }).click()

    await expect(page).toHaveURL(/\/$/)
    expect(api.callsTo({ path: '/estacoes/liberar' })).toHaveLength(1)
    expect(await readStoredSession({ page })).toBeNull()
  })
})

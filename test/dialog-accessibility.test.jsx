import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Dialog } from '../src/components/ui.jsx'

function DialogHarness() {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>Abrir diálogo</button>
      {abierto && (
        <Dialog titulo="Confirmar acción" descripcion="Revisa antes de continuar." onCerrar={() => setAbierto(false)}>
          <button type="button">Primera acción</button>
          <button type="button">Cerrar</button>
        </Dialog>
      )}
    </>
  )
}

describe('accesibilidad del diálogo', () => {
  afterEach(() => cleanup())

  it('lleva el foco al abrir, lo mantiene dentro al tabular y lo devuelve al cerrar', async () => {
    render(<DialogHarness />)
    const disparador = screen.getByRole('button', { name: 'Abrir diálogo' })
    disparador.focus()
    fireEvent.click(disparador)

    const dialogo = await screen.findByRole('dialog', { name: 'Confirmar acción' })
    const primera = screen.getByRole('button', { name: 'Primera acción' })
    const ultima = screen.getByRole('button', { name: 'Cerrar' })
    expect(document.activeElement).toBe(dialogo)

    fireEvent.keyDown(dialogo, { key: 'Tab' })
    expect(document.activeElement).toBe(primera)
    fireEvent.keyDown(primera, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultima)
    fireEvent.keyDown(ultima, { key: 'Tab' })
    expect(document.activeElement).toBe(primera)

    fireEvent.keyDown(primera, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.activeElement).toBe(disparador)
  })

  it('aísla el fondo y bloquea el scroll mientras está abierto', async () => {
    render(<div className="app-shell"><DialogHarness /></div>)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir diálogo' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Confirmar acción' })
    expect(dialogo.closest('.app-shell')).toBeNull()
    expect(document.querySelector('.app-shell')).toHaveAttribute('inert')
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(dialogo, { key: 'Escape' })
    await waitFor(() => expect(document.querySelector('.app-shell')).not.toHaveAttribute('inert'))
    expect(document.body.style.overflow).toBe('')
  })
})

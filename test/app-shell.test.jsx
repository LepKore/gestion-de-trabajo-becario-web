import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../src/components/AppShell.jsx'

vi.mock('../src/auth/useAuth.js', () => ({
  useAuth: () => ({
    usuario: { id: 'owner', rol: 'ENCARGADO', nombre: 'Juan', correo: 'juan@upb.edu' },
    cerrarSesion: vi.fn(),
  }),
}))

afterEach(cleanup)

function montar(path) {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route element={<AppShell />}><Route path="*" element={<div>Contenido</div>} /></Route></Routes></MemoryRouter>)
}

describe('títulos de rutas de detalle', () => {
  it('identifica la vista de detalle de un trabajo en el encabezado y la miga', () => {
    montar('/trabajos/job-1')
    expect(screen.getByRole('heading', { name: 'Detalle del trabajo' })).toBeInTheDocument()
    expect(screen.getByText('MiBeca / Detalle del trabajo')).toBeInTheDocument()
  })

  it('identifica la vista de edición de un trabajo en el encabezado y la miga', () => {
    montar('/mis-trabajos/job-1/editar')
    expect(screen.getByRole('heading', { name: 'Editar trabajo' })).toBeInTheDocument()
    expect(screen.getByText('MiBeca / Editar trabajo')).toBeInTheDocument()
  })
})

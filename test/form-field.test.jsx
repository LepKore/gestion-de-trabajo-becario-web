import { expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach } from 'vitest'
import { Field } from '../src/components/ui.jsx'

afterEach(cleanup)

it('asocia etiqueta, ayuda y error al control', () => {
  render(
    <Field
      name="correo"
      label="Correo"
      hint="Usa el institucional"
      error="Formato inválido"
      value=""
      onChange={() => {}}
    />,
  )
  const control = screen.getByLabelText('Correo')
  expect(control).toBeInvalid()
  expect(control.getAttribute('aria-describedby')).toBe(
    `${control.id}-hint ${control.id}-error`,
  )
  expect(screen.getByText('Usa el institucional')).toHaveAttribute('id', `${control.id}-hint`)
  expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido')
})

it('sin error no marca aria-invalid ni anuncia alerta', () => {
  render(<Field name="nombre" label="Nombre" value="" onChange={() => {}} />)
  const control = screen.getByLabelText('Nombre')
  expect(control).not.toHaveAttribute('aria-invalid')
  expect(control).not.toHaveAttribute('aria-describedby')
  expect(screen.queryByRole('alert')).toBeNull()
})

it('entrega id y atributos ARIA al control cuando recibe children', () => {
  const onChange = vi.fn()
  render(
    <Field name="rol" label="Rol" error="Requerido">
      {(props) => <select {...props} onChange={onChange}><option>BECARIO</option></select>}
    </Field>,
  )
  const control = screen.getByLabelText('Rol')
  expect(control.tagName).toBe('SELECT')
  expect(control).toBeInvalid()
  expect(control.getAttribute('aria-describedby')).toBe(`${control.id}-error`)
  fireEvent.change(control, { target: { value: 'BECARIO' } })
  expect(onChange).toHaveBeenCalled()
})

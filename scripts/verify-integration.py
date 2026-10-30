import json
import sys
from playwright.sync_api import sync_playwright, expect

fixture = json.load(sys.stdin)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    for role in ['owner', 'student', 'admin']:
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:5175/login')
        page.get_by_label('Correo institucional').fill(fixture['users'][role]['correo'])
        page.get_by_label('Contraseña', exact=True).fill(fixture['users'][role]['password'])
        page.get_by_role('button', name='Ingresar', exact=True).click()
        page.wait_for_url('http://127.0.0.1:5175/')
        if role == 'owner':
            page.goto('http://127.0.0.1:5175/trabajos/' + fixture['jobId'])
            page.get_by_role('button', name='Evaluar a Ana Pérez').click()
            for label in ['Responsabilidad', 'Puntualidad', 'Proactividad', 'Comunicación']:
                page.get_by_label(label, exact=True).select_option('4')
            page.get_by_role('button', name='Guardar evaluación').click()
            expect(page.get_by_text('Promedio de evaluación:', exact=True)).to_be_visible()
            page.reload()
            expect(page.get_by_text('Promedio de evaluación:', exact=True)).to_be_visible()
            page.goto('http://127.0.0.1:5175/cierre-y-horas')
            expect(page.get_by_text('Recorrido navegador', exact=True).first).to_be_visible()
        elif role == 'student':
            expect(page.get_by_text('faltan realizar trabajos', exact=True)).to_be_visible()
            page.goto('http://127.0.0.1:5175/historial')
            expect(page.get_by_text('Recorrido navegador', exact=True).first).to_be_visible()
        else:
            page.goto('http://127.0.0.1:5175/admin/supervision')
            expect(page.get_by_text('Ana Pérez', exact=True)).to_be_visible()
            expect(page.get_by_text('Pendiente', exact=True)).to_be_visible()
            expect(page.get_by_text('Promedio de evaluación:', exact=True)).to_have_count(0)
            page.set_viewport_size({'width': 390, 'height': 844})
            page.get_by_role('region', name='Progreso de estudiantes').focus()
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            page.get_by_role('button', name='Ver historial').click()
            expect(page.get_by_role('dialog')).to_be_visible()
            page.keyboard.press('Escape')
            expect(page.get_by_role('dialog')).to_have_count(0)
        context.close()
        print(f'{role}: OK')
    assert not errors, errors
    browser.close()

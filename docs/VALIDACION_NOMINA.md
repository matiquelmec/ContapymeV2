# Validación de Nómina — Casos y valores esperados

Guía para validar manualmente el motor de remuneraciones en la app corriendo.
Las **anclas exactas** no dependen de la UF/UTM del período, así que deben
coincidir peso a peso. Los descuentos previsionales (AFP/Salud/Impuesto)
varían según la UF/UTM real del período.

## Anclas exactas (independientes de UF/UTM)

| Concepto | Entrada | Esperado |
|----------|---------|----------|
| Gratificación legal | 25% sobre $700.000 | **$175.000** |
| Tope gratificación mensual | 4,75 × IMM ($539.000) / 12 | **$213.354** |
| Semana corrida | $120.000 variable / 30 × 4 domingos | **$16.000** |
| Horas extra 50% | $700.000, 5 h, jornada 44 h | **$27.841** |
| Horas extra 100% | $700.000, 4 h, jornada 44 h | **$29.697** |
| Retención honorarios | 15,25% sobre $1.000.000 | **$152.500** |
| Honorarios líquido | $1.000.000 − retención | **$847.500** |

## Caso 1 — Honorarios (validación exacta)

1. Crear empleado **tipo Honorarios**, sueldo base `1.000.000`.
2. Procesar nómina.
3. Esperado: Retención **152.500**, Líquido **847.500**, sin AFP/Salud/AFC.
4. El PDF debe decir "Retención Honorarios", no las cotizaciones.
5. Al exportar **Previred** del período, el honorario debe quedar **omitido**.

## Caso 2 — Trabajador con conceptos nuevos

1. Empleado: sueldo `700.000`, gratificación ON, **semana corrida ON**, AFP Modelo, FONASA, jornada 44 h.
2. En **Novedades**: HH.EE. 50% = `5`, HH.EE. 100% = `4`, Bono Extra = `120.000`, Anticipo = `60.000`.
3. Procesar nómina y abrir el PDF. Verificar líneas separadas:
   - Gratificación **175.000**
   - Horas Extras 50% **27.841**, Horas Extras 100% **29.697**
   - Semana Corrida **16.000**
   - Bono Extra **120.000**, Viático (si se cargó)
   - Descuento "Anticipo de Sueldo" **60.000**
4. AFP/Salud/Impuesto dependen de la UF/UTM del período.

## Caso 3 — Licencia médica

1. En Novedades → tarjeta **Licencias Médicas**, registrar una licencia común de N días.
2. El empleado queda con días trabajados = 30 − N y movimiento Previred = 3.
3. Para accidente del trabajo → movimiento 6.

## Caso 4 — Jornada parcial

1. Empleado media jornada (22 h), sueldo proporcional.
2. No debe aparecer la advertencia "inferior al mínimo" (el piso se prorratea).

## Caso 5 — Vacaciones con feriados

1. Solicitar un rango que incluya el 18–19 de septiembre o Semana Santa.
2. Los días hábiles calculados deben **excluir** esos feriados.

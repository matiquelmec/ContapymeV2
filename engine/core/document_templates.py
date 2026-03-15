"""
PLANTILLAS DE DOCUMENTOS LABORALES CHILENOS
Migradas desde V1 (contractAnnexTemplates.ts) al Engine Python.
El Engine las usa para generar HTML → PDF vía WeasyPrint o similar.

Tipos de anexo disponibles:
- renovation:           Anexo Renovación de Contrato
- night_shift:          Pacto de Trabajo Nocturno
- overtime_agreement:   Pacto de Horas Extraordinarias (Art. 32 CT)
- vacation:             Comprobante de Feriado Legal
- salary_change:        Anexo Modificación de Sueldo
- position_change:      Anexo Modificación de Cargo
- schedule_change:      Anexo Modificación de Jornada
- termination_notice:   Carta de Aviso de Término (Art. 159/160/161)
"""

from datetime import date, datetime
from typing import Optional, List
from .utils import format_rut, format_currency, format_date_es


# ─── Estilos CSS comunes para todos los documentos ───────────────────────────
COMMON_CSS = """
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; font-size: 12pt; }
    h1 { text-align: center; font-size: 14pt; margin-bottom: 30px; }
    h2 { text-align: center; font-size: 13pt; }
    .content { text-align: justify; margin-bottom: 20px; }
    .content p { margin: 12px 0; }
    .info-box { border: 1px solid #000; padding: 15px; margin: 20px 0; }
    .changes-box { border: 1px solid #000; padding: 15px; margin: 20px 0; }
    .signatures { margin-top: 100px; display: flex; justify-content: space-between; }
    .signature-block { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
    @media print { body { margin: 20mm; } }
"""


def _html_wrapper(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>{COMMON_CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def _signatures(rep_nombre: str, rep_rut: str, emp_nombre: str, emp_rut: str) -> str:
    return f"""
    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line">
                <strong>{rep_nombre}</strong><br>
                {format_rut(rep_rut)}<br>
                <strong>EMPLEADOR</strong>
            </div>
        </div>
        <div class="signature-block">
            <div class="signature-line">
                <strong>{emp_nombre}</strong><br>
                {format_rut(emp_rut)}<br>
                <strong>TRABAJADOR</strong>
            </div>
        </div>
    </div>"""


# ─── 1. Anexo de Renovación ───────────────────────────────────────────────────
def generate_renovation_annex(
    emp_nombre: str, emp_rut: str,
    empresa_nombre: str, empresa_rut: str, empresa_dir: str,
    rep_nombre: str, rep_rut: str,
    fecha_contrato_original: str,
    fecha_anexo: str,
    cargo: str,
    renovation_type: str = "indefinido",  # "indefinido" | "plazo_fijo"
    nueva_fecha_termino: Optional[str] = None,
    nuevo_sueldo: Optional[int] = None,
    sueldo_actual: int = 0,
    fecha_vigencia: Optional[str] = None,
    motivo: Optional[str] = None,
    observaciones: Optional[str] = None,
) -> str:
    fecha_vig = fecha_vigencia or fecha_anexo
    clausulas = []
    c = 1

    clausulas.append(f"""
        <p><strong>PRIMERO:</strong> Las partes dejan constancia que con fecha {format_date_es(fecha_contrato_original)}
        suscribieron un contrato de trabajo, en virtud del cual el trabajador presta servicios como <strong>{cargo}</strong>.</p>""")
    c += 1

    if renovation_type == "indefinido":
        acuerdo = f"modificar el contrato de trabajo, transformándolo en un <strong>CONTRATO INDEFINIDO</strong>, a contar del {format_date_es(fecha_vig)}"
    else:
        acuerdo = (f"renovar el contrato de trabajo a plazo fijo por el período comprendido entre el "
                   f"{format_date_es(fecha_vig)} y el {format_date_es(nueva_fecha_termino or '')}")

    clausulas.append(f"""
        <p><strong>SEGUNDO:</strong> Por el presente instrumento, las partes acuerdan {acuerdo},
        manteniendo todas las demás condiciones establecidas en el contrato original.</p>""")
    c += 1

    if motivo:
        clausulas.append(f"<p><strong>{'ABCDEFGHIJK'[c-1]}ERCERO:</strong> La renovación se fundamenta en: {motivo}</p>")
        c += 1

    if nuevo_sueldo and nuevo_sueldo != sueldo_actual:
        num = ["PRIMERO","SEGUNDO","TERCERO","CUARTO","QUINTO","SEXTO"][c-1]
        clausulas.append(f"<p><strong>{num}:</strong> A contar de este anexo, la remuneración será de {format_currency(nuevo_sueldo)} mensuales brutos.</p>")
        c += 1

    num = ["PRIMERO","SEGUNDO","TERCERO","CUARTO","QUINTO","SEXTO"][c-1]
    clausulas.append(f"<p><strong>{num}:</strong> En todo lo no modificado por este anexo, continúan vigentes las estipulaciones del contrato original.</p>")
    if observaciones:
        clausulas.append(f"<p><strong>OBSERVACIONES:</strong> {observaciones}</p>")

    clausulas.append("<p>Para constancia, firman las partes en dos ejemplares de igual tenor y valor.</p>")

    body = f"""
    <h1>ANEXO DE RENOVACIÓN DE CONTRATO DE TRABAJO</h1>
    <div class="content">
        <p>En {empresa_dir}, a {format_date_es(fecha_anexo)}, entre <strong>{empresa_nombre}</strong>,
        RUT {format_rut(empresa_rut)}, representada por don(ña) <strong>{rep_nombre}</strong>,
        RUT {format_rut(rep_rut)}, en adelante "el empleador", y don(ña) <strong>{emp_nombre}</strong>,
        RUT {format_rut(emp_rut)}, en adelante "el trabajador", han acordado el siguiente anexo:</p>
        {''.join(clausulas)}
    </div>
    {_signatures(rep_nombre, rep_rut, emp_nombre, emp_rut)}"""

    return _html_wrapper(f"Anexo Renovación - {emp_nombre}", body)


# ─── 2. Pacto Trabajo Nocturno ────────────────────────────────────────────────
def generate_night_shift_annex(
    emp_nombre: str, emp_rut: str,
    empresa_nombre: str, empresa_rut: str, empresa_dir: str,
    rep_nombre: str, rep_rut: str,
    fecha_contrato_original: str,
    fecha_anexo: str, cargo: str,
    recargo_pct: int = 20,
    hora_inicio: str = "21:00", hora_fin: str = "07:00",
    dias: Optional[List[str]] = None,
    fecha_vigencia: Optional[str] = None,
    observaciones: Optional[str] = None,
) -> str:
    dias_str = ("los días " + ", ".join(dias)) if dias else "según turnos rotativos de la empresa"

    body = f"""
    <h1>PACTO DE TRABAJO EN HORARIO NOCTURNO</h1>
    <div class="content">
        <p>En {empresa_dir}, a {format_date_es(fecha_anexo)}, entre <strong>{empresa_nombre}</strong>,
        RUT {format_rut(empresa_rut)}, representada por <strong>{rep_nombre}</strong>,
        RUT {format_rut(rep_rut)}, y don(ña) <strong>{emp_nombre}</strong>, RUT {format_rut(emp_rut)}:</p>

        <p><strong>PRIMERO:</strong> El trabajador que se desempeña como <strong>{cargo}</strong>
        acepta voluntariamente realizar trabajo en horario nocturno.</p>

        <p><strong>SEGUNDO:</strong> Se entenderá por trabajo nocturno el ejecutado entre las
        {hora_inicio} y las {hora_fin} horas.</p>

        <p><strong>TERCERO:</strong> El horario nocturno se desarrollará {dias_str}.</p>

        <p><strong>CUARTO:</strong> Se percibirá un recargo del <strong>{recargo_pct}%</strong>
        sobre el valor de la hora ordinaria.</p>

        <p><strong>QUINTO:</strong> El empleador cumplirá con todas las normas de seguridad
        aplicables al trabajo nocturno (iluminación, transporte, pausas, evaluaciones médicas).</p>

        <p><strong>SEXTO:</strong> Vigencia desde el {format_date_es(fecha_vigencia or fecha_anexo)}.
        Cualquiera de las partes puede poner término con 30 días de aviso previo.</p>

        {f'<p><strong>OBSERVACIONES:</strong> {observaciones}</p>' if observaciones else ''}

        <p>Para constancia, firman en dos ejemplares.</p>
    </div>
    {_signatures(rep_nombre, rep_rut, emp_nombre, emp_rut)}"""

    return _html_wrapper(f"Pacto Trabajo Nocturno - {emp_nombre}", body)


# ─── 3. Pacto Horas Extraordinarias (Art. 32 CT) ─────────────────────────────
def generate_overtime_agreement(
    emp_nombre: str, emp_rut: str,
    empresa_nombre: str, empresa_rut: str, empresa_dir: str,
    rep_nombre: str, rep_rut: str,
    fecha_contrato_original: str,
    fecha_anexo: str, cargo: str,
    recargo_pct: int = 50,
    duracion_meses: int = 3,
    max_horas_semana: int = 10,
    justificacion: Optional[str] = None,
    fecha_vigencia: Optional[str] = None,
    observaciones: Optional[str] = None,
) -> str:
    from dateutil.relativedelta import relativedelta
    inicio = datetime.strptime(fecha_vigencia or fecha_anexo, "%Y-%m-%d")
    fin = inicio + relativedelta(months=duracion_meses)
    fecha_fin_str = fin.strftime("%Y-%m-%d")
    justif = justificacion or "las necesidades operacionales de la empresa y el aumento temporal de la demanda"

    body = f"""
    <div style="text-align:center;margin-bottom:30px;">
        <h1>ANEXO CONTRACTUAL</h1>
        <h2>PACTO DE HORAS EXTRAORDINARIAS</h2>
        <p><em>Artículo 32 del Código del Trabajo</em></p>
    </div>
    <div class="content">
        <p>En {empresa_dir}, a {format_date_es(fecha_anexo)}, entre <strong>{empresa_nombre}</strong>,
        RUT {format_rut(empresa_rut)}, representada por <strong>{rep_nombre}</strong>,
        RUT {format_rut(rep_rut)}, y don(ña) <strong>{emp_nombre}</strong>, RUT {format_rut(emp_rut)}:</p>

        <p><strong>PRIMERO:</strong> Las partes dejan constancia que con fecha {format_date_es(fecha_contrato_original)}
        suscribieron contrato, prestando servicios como <strong>{cargo}</strong>.</p>

        <p><strong>SEGUNDO:</strong> Las partes acuerdan un <strong>PACTO DE HORAS EXTRAORDINARIAS</strong>.</p>

        <p><strong>TERCERO:</strong> Las horas extraordinarias se pagarán con recargo del
        <strong>{recargo_pct}%</strong> sobre el valor de la hora ordinaria (Art. 32 CT).</p>

        <p><strong>CUARTO:</strong> No podrá realizarse más de <strong>{max_horas_semana} horas extraordinarias
        por semana</strong> (máximo 2 horas diarias, Art. 31 CT).</p>

        <p><strong>QUINTO:</strong> Justificación: {justif}.</p>

        <p><strong>SEXTO:</strong> Vigencia: desde el {format_date_es(fecha_vigencia or fecha_anexo)}
        hasta el {format_date_es(fecha_fin_str)} ({duracion_meses} meses).</p>

        <p><strong>SÉPTIMO:</strong> Las horas extraordinarias se liquidarán mensualmente junto
        con la remuneración.</p>

        {f'<p><strong>OCTAVO:</strong> {observaciones}</p>' if observaciones else ''}

        <p><strong>{'NOVENO' if observaciones else 'OCTAVO'}:</strong> En lo no modificado,
        continúan vigentes las estipulaciones del contrato original.</p>

        <p>Para constancia, firman en dos ejemplares.</p>
    </div>
    {_signatures(rep_nombre, rep_rut, emp_nombre, emp_rut)}"""

    return _html_wrapper(f"Pacto Horas Extras - {emp_nombre}", body)


# ─── 4. Comprobante de Feriado Legal ─────────────────────────────────────────
def generate_vacation_certificate(
    emp_nombre: str, emp_rut: str,
    empresa_nombre: str, empresa_rut: str,
    rep_nombre: str, rep_rut: str,
    fecha_anexo: str, cargo: str,
    departamento: Optional[str],
    fecha_inicio_vacaciones: str,
    fecha_fin_vacaciones: str,
    dias_vacaciones: int,
    dias_pendientes: Optional[int] = None,
    motivo: Optional[str] = None,
    observaciones: Optional[str] = None,
) -> str:
    depto_str = f"en el departamento de {departamento}" if departamento else ""

    body = f"""
    <h1>COMPROBANTE DE FERIADO LEGAL</h1>
    <div class="content">
        <p>Se deja constancia que don(ña) <strong>{emp_nombre}</strong>,
        RUT {format_rut(emp_rut)}, quien se desempeña como <strong>{cargo}</strong>
        {depto_str} de la empresa <strong>{empresa_nombre}</strong>,
        RUT {format_rut(empresa_rut)}, hará uso de su feriado legal.</p>

        <div class="info-box">
            <p><strong>DETALLE DEL FERIADO:</strong></p>
            <p>• <strong>Fecha de inicio:</strong> {format_date_es(fecha_inicio_vacaciones)}</p>
            <p>• <strong>Fecha de término:</strong> {format_date_es(fecha_fin_vacaciones)}</p>
            <p>• <strong>Total días hábiles:</strong> {dias_vacaciones} días</p>
            <p>• <strong>Fecha de reintegro:</strong> {format_date_es(fecha_fin_vacaciones)}</p>
            {f"<p>• <strong>Días pendientes:</strong> {dias_pendientes} días</p>" if dias_pendientes else ""}
        </div>

        {f'<p><strong>MOTIVO:</strong> {motivo}</p>' if motivo and motivo != 'Feriado legal' else ''}

        <p><strong>IMPORTANTE:</strong></p>
        <ul>
            <li>El trabajador deberá reintegrarse el día {format_date_es(fecha_fin_vacaciones)}.</li>
            <li>Durante el feriado, el trabajador mantendrá su remuneración íntegra.</li>
            <li>Este período se considera como efectivamente trabajado para todos los efectos legales.</li>
        </ul>

        {f'<p><strong>OBSERVACIONES:</strong> {observaciones}</p>' if observaciones else ''}

        <p><strong>Fecha de emisión:</strong> {format_date_es(fecha_anexo)}</p>
        <p>Se extiende en dos ejemplares, quedando uno en poder de cada parte.</p>
    </div>
    {_signatures(rep_nombre, rep_rut, emp_nombre, emp_rut)}"""

    return _html_wrapper(f"Comprobante Feriado - {emp_nombre}", body)


# ─── 5. Anexo de Modificación de Condiciones ─────────────────────────────────
def generate_change_annex(
    emp_nombre: str, emp_rut: str,
    empresa_nombre: str, empresa_rut: str, empresa_dir: str,
    rep_nombre: str, rep_rut: str,
    fecha_contrato_original: str,
    fecha_anexo: str,
    cambios: List[str],          # Lista de ítems de cambio para mostrar
    fecha_vigencia: Optional[str] = None,
    clausulas_adicionales: Optional[List[str]] = None,
    observaciones: Optional[str] = None,
) -> str:
    cambios_html = "\n".join(f"<li>{c}</li>" for c in cambios)
    adicionales_html = ""
    if clausulas_adicionales:
        items = "\n".join(f"<li>{c}</li>" for c in clausulas_adicionales)
        adicionales_html = f"<p><strong>TERCERO:</strong> Cláusulas adicionales:</p><ul>{items}</ul>"

    body = f"""
    <h1>ANEXO DE MODIFICACIÓN DE CONTRATO DE TRABAJO</h1>
    <div class="content">
        <p>En {empresa_dir}, a {format_date_es(fecha_anexo)}, entre <strong>{empresa_nombre}</strong>,
        RUT {format_rut(empresa_rut)}, representada por <strong>{rep_nombre}</strong>,
        RUT {format_rut(rep_rut)}, y don(ña) <strong>{emp_nombre}</strong>, RUT {format_rut(emp_rut)}:</p>

        <p><strong>PRIMERO:</strong> Las partes dejan constancia que con fecha {format_date_es(fecha_contrato_original)}
        suscribieron contrato de trabajo vigente a la fecha.</p>

        <p><strong>SEGUNDO:</strong> Las partes acuerdan modificar las siguientes condiciones:</p>
        <div class="changes-box">
            <p><strong>MODIFICACIONES ACORDADAS:</strong></p>
            <ul>{cambios_html}</ul>
            {f"<p><strong>Fecha de vigencia:</strong> {format_date_es(fecha_vigencia)}</p>" if fecha_vigencia else ""}
        </div>

        {adicionales_html}

        <p><strong>{'CUARTO' if clausulas_adicionales else 'TERCERO'}:</strong>
        En lo no modificado, continúan vigentes las estipulaciones del contrato original.</p>

        {f'<p><strong>OBSERVACIONES:</strong> {observaciones}</p>' if observaciones else ''}

        <p>Para constancia, firman en dos ejemplares de igual tenor y valor.</p>
    </div>
    {_signatures(rep_nombre, rep_rut, emp_nombre, emp_rut)}"""

    return _html_wrapper(f"Anexo Modificación - {emp_nombre}", body)


# ─── 6. Carta de Aviso de Término de Contrato ────────────────────────────────
def generate_termination_notice(
    emp_nombre: str, emp_rut: str,
    rep_nombre: str, rep_rut: str,
    empresa_nombre: str,
    articulo_codigo: str,          # Ej: "161-1", "159-4", "160-7"
    articulo_nombre: str,          # Nombre completo del artículo
    fecha_termino: str,
    requiere_aviso: bool = False,
    dias_aviso: int = 30,
    ciudad: str = "Punta Arenas",
    rep_cargo: str = "GERENTE GENERAL",
) -> str:
    fecha_hoy = format_date_es(date.today().isoformat())
    fecha_termino_fmt = format_date_es(fecha_termino)
    es_no_renovacion = articulo_codigo == "159-4"

    if es_no_renovacion:
        intro = (f"por medio de la presente comunicamos a Ud. que sus servicios terminarán el día "
                 f"{fecha_termino_fmt}, de acuerdo con lo convenido en el contrato de trabajo a plazo fijo "
                 f"y conforme al artículo 159 N°4 del Código del Trabajo.")
        ref = "Aviso de no Renovación de Contrato"
    else:
        intro = (f"hemos resuelto poner término a su contrato de trabajo, en virtud de lo dispuesto en el "
                 f"{articulo_nombre} del Código del Trabajo. El término será efectivo el {fecha_termino_fmt}.")
        ref = "Aviso de Término de Contrato de Trabajo"

    aviso_text = ""
    if requiere_aviso:
        aviso_text = f"\n\n                              Conforme a la ley, se le otorga un preaviso de {dias_aviso} días hábiles."
    elif not es_no_renovacion:
        aviso_text = "\n\n                              Dado que la causal no requiere preaviso, el término es inmediato."

    carta = f"""{ciudad}, {fecha_hoy}

Señor(a)
{emp_nombre.upper()}
RUT {format_rut(emp_rut)}
Presente:

Ref.: {ref}.

                              Por medio de la presente, {intro}
{aviso_text}

                              Asimismo, ponemos en su conocimiento que sus cotizaciones previsionales y de salud se encuentran al día.

                              Su feriado proporcional se encontrará a su disposición en el portal de la Dirección del Trabajo.

                Sin otro particular saluda atentamente a Ud.




p.p. {rep_nombre}
{rep_cargo}
RUT N° {format_rut(rep_rut)}




C.c.
Dirección del Trabajo
Carpeta Funcionario"""

    return carta


# ─── Dispatcher principal ────────────────────────────────────────────────────
ANNEX_TYPES = {
    "renovation":         generate_renovation_annex,
    "night_shift":        generate_night_shift_annex,
    "overtime_agreement": generate_overtime_agreement,
    "vacation":           generate_vacation_certificate,
    "salary_change":      generate_change_annex,
    "position_change":    generate_change_annex,
    "schedule_change":    generate_change_annex,
}

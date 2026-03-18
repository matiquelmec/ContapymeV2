
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

sql = """
-- 1. Nueva tabla de causales de término
CREATE TABLE IF NOT EXISTS public.termination_causes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_code VARCHAR(20) NOT NULL UNIQUE,
    article_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_notice BOOLEAN NOT NULL DEFAULT false,
    notice_days INTEGER DEFAULT 0,
    requires_severance BOOLEAN NOT NULL DEFAULT false,
    severance_calculation_type VARCHAR(50),
    is_with_just_cause BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Actualizar employee_terminations con campos detallados
ALTER TABLE public.employee_terminations 
ADD COLUMN IF NOT EXISTS worked_days_last_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_salary_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_vacation_days_earned DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vacation_days_taken DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vacation_daily_rate BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS proportional_vacation_days DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS proportional_vacation_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS severance_years_service DECIMAL(4,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS severance_monthly_salary BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS notice_indemnification_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS christmas_bonus_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_bonuses_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_overtime_amount BIGINT DEFAULT 0;

-- 3. Datos iniciales de causales
INSERT INTO public.termination_causes (article_code, article_name, description, requires_notice, notice_days, requires_severance, severance_calculation_type, is_with_just_cause, category) VALUES 
('161-1', 'Art. 161 N°1 - Necesidades de la empresa', 'Terminación del contrato por necesidades de la empresa, establecimiento o servicio', true, 30, true, 'years_service', false, 'employer_initiative'),
('159-1', 'Art. 159 N°1 - Mutuo acuerdo de las partes', 'Terminación del contrato de común acuerdo entre las partes', false, 0, false, null, false, 'mutual_agreement'),
('159-2', 'Art. 159 N°2 - Renuncia del trabajador', 'Renuncia voluntaria del trabajador', false, 0, false, null, false, 'employee_initiative'),
('159-3', 'Art. 159 N°3 - Muerte del trabajador', 'Término por fallecimiento del trabajador', false, 0, false, null, false, 'force_majeure'),
('159-4', 'Art. 159 N°4 - Vencimiento del plazo', 'Cumplimiento del plazo convenido en el contrato', false, 0, false, null, false, 'force_majeure'),
('159-5', 'Art. 159 N°5 - Conclusión de obra', 'Término por finalización de la faena o servicio que dio origen al contrato', false, 0, false, null, false, 'force_majeure'),
('160-1', 'Art. 160 N°1 - Falta de probidad', 'Conductas indebidas de carácter grave debidamente comprobadas', false, 0, false, null, true, 'employer_initiative'),
('160-7', 'Art. 160 N°7 - Incumplimiento grave', 'Incumplimiento grave de las obligaciones que impone el contrato', false, 0, false, null, true, 'employer_initiative')
ON CONFLICT (article_code) DO NOTHING;

-- 4. RLS para causales
ALTER TABLE public.termination_causes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for causes" ON public.termination_causes;
CREATE POLICY "Public read access for causes" ON public.termination_causes FOR SELECT USING (true);
"""

def apply_migration():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Conectado a la base de datos...")
        cur.execute(sql)
        conn.commit()
        print("Migración aplicada exitosamente.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error al aplicar migración: {e}")

if __name__ == "__main__":
    apply_migration()

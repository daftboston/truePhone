/**
 * @file page.tsx
 * @description Public PQR channel at /pqr (Peticiones, quejas y reclamos).
 * @dependencies AppShell, SiteFooter, PqrForm, legal constants
 */

import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { PqrForm } from "@/features/pqr/components/pqr-form";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_CONTACT_MAILTO,
  LEGAL_LAST_UPDATED_LABEL,
  LEGAL_PATHS,
} from "@/lib/legal";
import { formatOperatorIdentityLegalParagraph } from "@/lib/legal/operator-identity";
import { resolveProfileEmail } from "@/lib/notifications/resolve-email";

export const metadata: Metadata = {
  title: "Peticiones, quejas y reclamos (PQR)",
  description:
    "Radica peticiones, quejas, reclamos o retracto ante TruePhone. Respuesta en 15 días hábiles.",
};

/**
 * PqrPage
 *
 * Public PQR page with legal context, retracto blurb, and submission form.
 *
 * @returns PQR page with guest or signed-in prefilled form.
 */
export default async function PqrPage() {
  const current = await getCurrentProfile();
  const defaultEmail = current
    ? await resolveProfileEmail(current.profile.id)
    : null;

  return (
    <>
      <AppShell mainClassName="gap-10 md:gap-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Peticiones, quejas y reclamos (PQR)
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Canal oficial para radicar peticiones, quejas, reclamos, retracto o
            solicitudes sobre datos personales ante TruePhone.
          </p>
          <p className="text-muted-foreground text-xs">
            Última actualización: {LEGAL_LAST_UPDATED_LABEL}
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl space-y-10">
          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Cómo radicar
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Completa el formulario de esta página o escribe a{" "}
              <a
                href={LEGAL_CONTACT_MAILTO}
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>{" "}
              indicando tu nombre, correo, número de pedido (si aplica) y el
              motivo. Al enviar el formulario recibirás un número de radicado y
              la fecha y hora de radicación.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Plazos de respuesta
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              TruePhone responderá tu PQR en un máximo de quince (15) días
              hábiles contados a partir del día siguiente a la radicación. Si
              necesitamos información adicional, te lo pediremos y el plazo
              podrá ampliarse hasta por quince (15) días hábiles más,
              informándote previamente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Derecho de retracto
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Si compraste a distancia en TruePhone, puedes ejercer retracto en
              los casos permitidos por el artículo 47 de la Ley 1480 de 2011.
              Radica tipo «Retracto» en este formulario o escribe a{" "}
              {LEGAL_CONTACT_EMAIL} con el número de pedido. Los detalles del
              plazo, devolución y reembolso están en la sección «Derecho de
              retracto» de nuestros{" "}
              <Link
                href={LEGAL_PATHS.terms}
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Términos y condiciones
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Identidad del operador
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {formatOperatorIdentityLegalParagraph()}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Superintendencia de Industria y Comercio (SIC)
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Si no recibes respuesta satisfactoria dentro de los plazos
              legales, puedes acudir ante la Superintendencia de Industria y
              Comercio (SIC), entidad competente para la protección al
              consumidor en Colombia.
            </p>
          </section>

          <section className="border-border space-y-4 rounded-xl border p-4">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              Radicar un caso
            </h2>
            <PqrForm
              defaultEmail={defaultEmail}
              defaultFullName={current?.profile.fullName}
            />
          </section>

          <div className="border-border space-y-4 border-t pt-6">
            <Button asChild variant="outline">
              <Link href={LEGAL_PATHS.help}>Ir a Ayuda</Link>
            </Button>
          </div>
        </div>
      </AppShell>
      <SiteFooter />
    </>
  );
}

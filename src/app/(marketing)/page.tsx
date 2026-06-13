// ============================================
// Home - Página inicial do site (landing page)
// Apresenta o StreamLedger com texto e imagem
// ============================================

import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";

export default function Home() {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Grid de 2 colunas: texto à esquerda, imagem à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Coluna do texto */}
          <div className="order-2 lg:order-1">
            <FadeIn>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[65px] font-bold text-neon leading-tight mb-6 lg:mb-8">
                StreamLedger
              </h1>
            </FadeIn>

            {/* Botão para acessar o protótipo */}
            <FadeIn delay={0.1}>
              <p className="mb-4 text-center lg:text-left">
                <Link
                  href="/dashboard"
                  className="inline-block px-6 py-3 rounded-full border border-neon/20 font-semibold hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  Conheça nosso primeiro protótipo
                </Link>
              </p>
            </FadeIn>

            {/* Descrição do projeto */}
            <FadeIn delay={0.2}>
              <p className="text-muted leading-relaxed mb-4">
                O StreamLedger é uma plataforma criada para ajudar streamers iniciantes a
                organizarem e entenderem melhor suas finanças. Em um único lugar, você pode
                acompanhar seus ganhos, controlar custos, registrar doações e visualizar todas
                as suas movimentações de forma simples e clara, permitindo que criadores de
                conteúdo gamers tenham uma visão completa da sua atividade financeira.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="text-muted leading-relaxed">
                Nosso objetivo é ajudar streamers a transformar sua paixão por jogar e criar
                conteúdo em algo mais organizado, profissional e sustentável, oferecendo mais
                clareza sobre seus ganhos e incentivando uma gestão financeira mais consciente
                desde o início da jornada no streaming.
              </p>
            </FadeIn>
          </div>

          {/* Coluna da imagem */}
          <FadeIn className="order-1 lg:order-2 flex justify-center" delay={0.2}>
            <Image
              src="/assets/hero-dashboard.svg"
              alt="Dashboard StreamLedger"
              width={500}
              height={400}
              className="w-full max-w-md lg:max-w-full"
              priority
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

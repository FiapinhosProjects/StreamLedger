// ============================================
// Sobre - Página "Nossa Motivação" e "Nossa Solução"
// Explica por que o StreamLedger foi criado
// ============================================

import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";

export default function Sobre() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Seção 1: Nossa Motivação */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <FadeIn>
            <h1 className="text-[65px] font-bold text-neon mb-8 whitespace-nowrap">Nossa Motivação</h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                O universo do streaming cresce cada vez mais, atraindo milhares de pessoas que desejam compartilhar conteúdo, construir comunidades e transformar sua paixão por games em uma atividade profissional. No entanto, muitos streamers iniciantes enfrentam dificuldades quando começam a lidar com questões financeiras.
              </p>
              <p className="text-muted leading-relaxed">
                Ganhos provenientes de doações, inscrições, parcerias e outras formas de monetização muitas vezes acabam sendo registrados de forma desorganizada, o que dificulta o controle de receitas, despesas e até mesmo o planejamento de crescimento do canal.
              </p>
            </div>
          </FadeIn>
        </div>
        <FadeIn className="flex justify-center" delay={0.2}>
          <Image src="/assets/motivacao.svg" alt="Motivação" width={400} height={400} className="w-full max-w-sm" />
        </FadeIn>
      </section>

      {/* Seção 2: Texto + imagem invertidos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <FadeIn className="order-2 lg:order-1 flex justify-center" delay={0.1}>
          <Image src="/assets/solucao.svg" alt="Solução" width={400} height={400} className="w-full max-w-sm" />
        </FadeIn>
        <FadeIn className="order-1 lg:order-2 space-y-4" delay={0.2}>
          <p className="text-muted leading-relaxed">
            Foi pensando nesse cenário que surgiu o StreamLedger. Nosso objetivo é oferecer uma solução simples e acessível que ajude criadores de conteúdo a organizarem melhor suas finanças, acompanharem sua evolução e tomarem decisões mais conscientes sobre investimentos e gestão do seu trabalho digital.
          </p>
          <p className="text-muted leading-relaxed">
            Acreditamos que, com as ferramentas certas, streamers podem focar no que realmente importa: criar conteúdo, crescer sua comunidade e transformar sua paixão em algo sustentável.
          </p>
        </FadeIn>
      </section>

      <hr className="border-white/10 my-16" />

      {/* Seção 3: Nossa Solução */}
      <FadeIn>
        <h2 className="text-[36px] font-bold text-neon text-center mt-16">Nossa Solução</h2>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="max-w-3xl mx-auto space-y-4 mt-8 text-justify">
          <p className="text-muted leading-relaxed">
            O StreamLedger foi pensado para simplificar a gestão financeira de streamers iniciantes, reunindo em um único lugar as informações mais importantes sobre seus ganhos e despesas dentro do universo do streaming.
          </p>
          <p className="text-muted leading-relaxed">
            A plataforma oferece uma visão geral clara e organizada, através de um dashboard com gráficos e indicadores que permitem acompanhar faturamento, custos, lucro e movimentações recentes. Dessa forma, o streamer consegue entender melhor de onde vem sua receita e como seu dinheiro está sendo utilizado.
          </p>
          <p className="text-muted leading-relaxed">
            Além disso, o StreamLedger também permite registrar entradas como doações, inscrições e outras fontes de monetização, bem como controlar despesas relacionadas ao canal, como equipamentos, softwares ou melhorias no setup. A plataforma também busca facilitar o acompanhamento de obrigações financeiras e impostos, ajudando o criador de conteúdo a manter tudo mais organizado.
          </p>
          <p className="text-muted leading-relaxed">
            Com isso, o StreamLedger transforma dados financeiros em informações claras e acessíveis, permitindo que streamers iniciantes tenham mais controle sobre seu crescimento e consigam administrar sua atividade de forma mais profissional.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

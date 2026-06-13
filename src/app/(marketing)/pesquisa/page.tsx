// ============================================
// Pesquisa - Página sobre o mercado de streaming
// Mostra dados sobre plataformas e pesquisa de aplicação
// ============================================

import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";

// Dados das plataformas de streaming para a tabela
const platforms = [
  { name: "Twitch", badge: "T", color: "#6441a5", monetization: "Inscrições, doações, anúncios", popularity: "Muito alta", popType: "high" },
  { name: "YouTube Gaming", badge: "▶", color: "#ff0000", monetization: "Anúncios, super chats", popularity: "Alta", popType: "high" },
  { name: "Kick", badge: "K", color: "#2d9c2d", monetization: "Doações, parcerias", popularity: "Crescendo", popType: "medium" },
  { name: "TikTok Live", badge: "♪", color: "#111111", monetization: "Presentes virtuais", popularity: "Alta", popType: "high" },
];

export default function Pesquisa() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Seção 1: Introdução sobre o crescimento dos streamers */}
      <section className="mb-12 lg:mb-16">
        <FadeIn>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[65px] font-bold text-neon mb-4 sm:mb-6 leading-tight text-center">
            O crescimento dos<br />Streamers Gamers
          </h1>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="space-y-4">
            <p className="text-muted leading-relaxed">
              Nos últimos anos, o mercado de games e criação de conteúdo digital tem apresentado
              um crescimento significativo. Plataformas de streaming se tornaram espaços importantes
              não apenas para entretenimento, mas também para geração de renda por parte de criadores
              de conteúdo.
            </p>
            <p className="text-muted leading-relaxed">
              Atualmente, streamers podem monetizar suas transmissões de diversas formas, como
              inscrições de seguidores, doações enviadas pelo público durante as lives, parcerias com
              marcas e receitas provenientes de anúncios exibidos nas plataformas. Esse modelo de
              monetização tem incentivado cada vez mais pessoas a iniciarem suas atividades no universo
              do streaming.
            </p>
            <p className="text-muted leading-relaxed">
              Entre as plataformas mais populares estão Twitch, YouTube Gaming, Kick e TikTok Live,
              cada uma oferecendo diferentes formas de monetização e atraindo milhões de usuários ao
              redor do mundo. A tabela a seguir apresenta algumas dessas plataformas e seus principais
              modelos de monetização.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Tabela de plataformas */}
      <FadeIn>
        <section className="mb-12 lg:mb-16 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="border border-border rounded-lg min-w-[500px] sm:min-w-0">
            <table className="w-full text-left">
              <thead className="bg-[#1e3020]">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-neon uppercase tracking-wider">Plataforma</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neon uppercase tracking-wider">Tipo de Monetização</th>
                  <th className="py-3 px-4 text-xs font-semibold text-neon uppercase tracking-wider">Popularidade</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {platforms.map((p) => (
                  <tr key={p.name} className="border-t border-white/5 hover:bg-neon/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {/* Badge colorido da plataforma */}
                        <span
                          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-extrabold text-white"
                          style={{ background: p.color }}
                        >
                          {p.badge}
                        </span>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted">{p.monetization}</td>
                    <td className="py-4 px-4">
                      {/* Badge de popularidade (verde = alta, amarelo = crescendo) */}
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                        p.popType === "high"
                          ? "bg-neon/10 text-neon border-neon/30"
                          : "bg-yellow/10 text-yellow border-yellow/30"
                      }`}>
                        {p.popularity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </FadeIn>

      <hr className="border-white/10 mb-16" />

      {/* Seção 2: Pesquisa de Aplicação */}
      <section>
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl md:text-[36px] font-extrabold text-neon text-center mb-6 lg:mb-8">Pesquisa de Aplicação</h2>
        </FadeIn>

        {/* Texto + gráfico lado a lado */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-8">
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                O mercado de games vem crescendo de forma consistente e se consolidando como um dos
                principais segmentos da economia digital. Segundo a Newzoo, o mercado global de jogos
                deve alcançar cerca de US$ 188,8 bilhões em 2025, com aproximadamente 3,6 bilhões de
                jogadores no mundo. Esses números mostram não apenas a força do setor, mas também o
                tamanho da comunidade conectada ao universo gamer, que assim como os números, tendem
                a crescer cada vez mais.
              </p>
              <p className="text-muted leading-relaxed">
                Dentro desse cenário, o streaming de jogos se tornou uma parte importante da experiência
                de muitos jogadores e criadores de conteúdo. Plataformas como Twitch, YouTube Gaming,
                Kick e TikTok Live permitem que streamers criem comunidades, compartilhem conteúdo ao
                vivo e, em muitos casos, transformem essa atividade em fonte de renda.
              </p>
            </div>
            <div className="flex justify-center">
              <Image src="/assets/grafico-mercado.svg" alt="Gráfico de crescimento do mercado de games" width={500} height={400} className="w-full max-w-[280px] sm:max-w-md" />
            </div>
          </div>
        </FadeIn>

        {/* Mais texto sobre monetização e o StreamLedger */}
        <FadeIn delay={0.2}>
          <div className="space-y-4 mb-12">
            <p className="text-muted leading-relaxed">
              Além do alcance e da visibilidade, essas plataformas oferecem diferentes formas de
              monetização. Na Twitch, por exemplo, criadores podem ganhar com recursos como inscrições
              e outras ferramentas de monetização para afiliados e parceiros. No YouTube, transmissões
              ao vivo podem gerar receita por meio de anúncios, Super Chat, Super Stickers e membros
              do canal.
            </p>
            <p className="text-muted leading-relaxed">
              Esse modelo abre oportunidades para que streamers iniciantes comecem a monetizar seu
              conteúdo, mas também cria um novo desafio: o controle financeiro. Quando a renda passa
              a vir de várias fontes diferentes, como doações, inscrições, anúncios e parcerias, muitos
              criadores encontram dificuldade para organizar entradas, saídas, investimentos e até
              obrigações como impostos. Essa desorganização pode prejudicar a visão real de
              faturamento, lucro e crescimento do canal.
            </p>
            <p className="text-muted leading-relaxed">
              Foi a partir dessa necessidade que surgiu a ideia do StreamLedger. O projeto propõe uma
              plataforma voltada para streamers iniciantes, permitindo acompanhar faturamento, custos,
              lucro, movimentações recentes e outras informações financeiras importantes em um só lugar.
              Assim, a pesquisa de mercado não apenas contextualiza o universo gamer, mas também
              justifica a criação de uma solução pensada para tornar a atividade de streaming mais
              organizada, profissional e sustentável.
            </p>
          </div>
        </FadeIn>

        {/* Vídeo */}
        <FadeIn delay={0.1}>
          <div className="max-w-3xl mx-auto rounded-lg border border-border overflow-hidden">
            <video
              className="w-full block"
              autoPlay
              muted
              loop
              playsInline
              controls
            >
              <source src="/assets/streamer.mp4" type="video/mp4" />
            </video>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

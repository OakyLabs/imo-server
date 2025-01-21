import { Hono } from "hono";
import { Layout } from "./components/Layout";

const home_router = new Hono();

function Hero() {
  return (
    <section className="bg-blue-600 text-white py-20">
      <div className="px-4 text-center container mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          Investimento imobiliário simplificado
        </h1>
        <p className="text-xl mb-4">
          Oportunidades de investimento em Portugal, enviados diretamente para o
          seu telemóvel
        </p>
      </div>
    </section>
  );
}

home_router.get("/", (c) => {
  return c.html(
    <Layout>
      <Hero />
    </Layout>,
  );
});

export { home_router };

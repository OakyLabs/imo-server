import { Child } from "hono/jsx";

export function Layout({ children }: { children: Child }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <link rel="stylesheet" href="css/style.css" />
      </head>
      <body>
        <div class="min-h-screen flex flex-col">
          <Nav />
          <main class="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

function Nav() {
  return (
    <nav class="container mx-auto">
      <header class="bg-white ">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/">ImoExclusivo</a>
          <ul className="flex space-x-6">
            <li>
              <a href="/inscricao">Inscrever</a>
            </li>
            <li>
              <a href="/sobre">Sobre nós</a>
            </li>
            <li>
              <a href="/contact">Contacto</a>
            </li>
          </ul>
        </div>
      </header>
    </nav>
  );
}

function Footer() {
  return (
    <footer class="bg-gray-800 text-white py-8">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 class="text-xl font-semibold mb-4">ImoExclusivo</h3>
            <p class="text-gray-400">
              O seu parceiro na procura de investimentos imobiliários em
              Portugal
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold mb-4">Links</h4>
            <ul class="space-y-2">
              <li>
                <a href="/auctions" class="text-gray-400 hover:text-white">
                  Increva-se
                </a>
              </li>
              <li>
                <a href="/about" class="text-gray-400 hover:text-white">
                  Sobre nós
                </a>
              </li>
              <li>
                <a href="/contact" class="text-gray-400 hover:text-white">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="/terms" class="text-gray-400 hover:text-white">
                  Termos e condições
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="text-lg font-semibold mb-4">Contactos</h4>
            <p class="text-gray-400">Avenida</p>
            <p class="text-gray-400">Amsterdão</p>
            <p class="text-gray-400">Phone: (123) 456-7890</p>
            <p class="text-gray-400">Email: info@imoexclusivo.pt</p>
          </div>
        </div>
        <div class="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ImoExclusivo</p>
        </div>
      </div>
    </footer>
  );
}

'use client';
import Link from 'next/link';
import TestConsole from '@/components/api-docs/TestConsole';

export default function ApiDocs() {
  const codeFetch = `
fetch("https://api.cnb.com/v1/fitting/try-on", {
  method: "POST",
  headers: {
    "Authorization": "Bearer TU_API_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    userPhoto: "https://tusitio.com/foto-usuario.jpg",
    garments: [
      "https://tusitio.com/remera.jpg",
      "https://tusitio.com/pantalon.jpg"
    ]
  })
})
.then(res => res.json())
.then(data => console.log(data));
  `.trim();

  const codePython = `
import requests

url = "https://api.cnb.com/v1/fitting/try-on"
headers = {
    "Authorization": "Bearer TU_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "userPhoto": "https://tusitio.com/foto-usuario.jpg",
    "garments": [
        "https://tusitio.com/remera.jpg"
    ]
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
  `.trim();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8ddd0] font-sans antialiased selection:bg-[#8B2635]/30 selection:text-white">
      
      {/* Barra superior de navegación */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]/85 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="font-serif font-light text-2xl tracking-wider text-[#f5f0eb]">CnB</span>
            <span className="text-[10px] text-[#d4c5b0]/55 font-mono group-hover:text-[#8B2635] transition-colors hidden xs:inline">← Inicio</span>
          </Link>
          <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider text-[#d4c5b0]/75 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            <a href="#intro" className="hover:text-[#8B2635] transition-colors flex-shrink-0">Introducción</a>
            <a href="#console" className="hover:text-[#8B2635] transition-colors flex-shrink-0">Consola de Prueba</a>
            <a href="#auth" className="hover:text-[#8B2635] transition-colors flex-shrink-0">Autenticación</a>
            <a href="#endpoints" className="hover:text-[#8B2635] transition-colors flex-shrink-0">Endpoints</a>
            <a href="#errors" className="hover:text-[#8B2635] transition-colors flex-shrink-0">Errores</a>
          </div>
        </div>
      </header>

      {/* Grid de contenido */}
      <main className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Sidebar de navegación */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start">
          <nav className="flex flex-col gap-4 text-sm text-[#d4c5b0]/75 font-medium border-l border-[#2a2a2a] pl-4">
            <a href="#intro" className="hover:text-[#f5f0eb] transition-colors block">1. Introducción</a>
            <a href="#console" className="hover:text-[#f5f0eb] transition-colors block font-semibold text-[#8B2635]">2. Consola de Prueba</a>
            <a href="#auth" className="hover:text-[#f5f0eb] transition-colors block">3. Autenticación</a>
            <a href="#endpoints" className="hover:text-[#f5f0eb] transition-colors block pl-2 border-l border-[#2a2a2a] hover:border-[#8B2635]">POST /try-on</a>
            <a href="#status" className="hover:text-[#f5f0eb] transition-colors block pl-2 border-l border-[#2a2a2a] hover:border-[#8B2635]">GET /status/:id</a>
            <a href="#usage" className="hover:text-[#f5f0eb] transition-colors block pl-2 border-l border-[#2a2a2a] hover:border-[#8B2635]">GET /usage</a>
            <a href="#rate-limits" className="hover:text-[#f5f0eb] transition-colors block">4. Límites (Rate Limiting)</a>
            <a href="#errors" className="hover:text-[#f5f0eb] transition-colors block">5. Códigos de Estado</a>
          </nav>
        </aside>

        {/* Sección de contenidos */}
        <section className="lg:col-span-9 flex flex-col gap-16 text-[#e8ddd0]/85 font-light">
          
          {/* Introducción */}
          <div id="intro" className="scroll-mt-24">
            <h1 className="text-3xl md:text-5xl font-serif font-light text-[#f5f0eb] tracking-wide mb-4">
              Documentación de la API de Vestidor Virtual
            </h1>
            <p className="text-[#d4c5b0]/80 text-sm md:text-base leading-relaxed mb-6 font-light">
              La API de vestidor virtual de CnB permite a marcas y e-commerce de terceros integrar nuestro procesador de probador de ropa inteligente mediante llamados REST HTTPS. Enviando una foto de cuerpo completo del usuario y fotos claras de las prendas, nuestra IA genera una imagen realista del cliente vistiendo dichas prendas de manera instantánea.
            </p>
            <div className="p-4 bg-[#8B2635]/10 border border-[#8B2635]/30 rounded-sm text-[#e8ddd0] text-sm">
              💡 <strong>¿Qué es la IA de Probador?</strong> Es un modelo interno optimizado para ajustar, doblar y superponer prendas sobre fotos humanas conservando texturas, logos y detalles físicos.
            </div>
          </div>

          {/* Consola de Prueba */}
          <div id="console" className="scroll-mt-24 border-t border-[#2a2a2a] pt-10">
            <h2 className="text-2xl font-serif font-light text-[#f5f0eb] tracking-wide mb-6">1. Consola de Prueba interactiva</h2>
            <TestConsole />
          </div>

          {/* Autenticación */}
          <div id="auth" className="scroll-mt-24 border-t border-[#2a2a2a] pt-10">
            <h2 className="text-2xl font-serif font-light text-[#f5f0eb] tracking-wide mb-4">2. Autenticación</h2>
            <p className="text-sm leading-relaxed mb-4">
              Cada solicitud que realices a la API de CnB debe estar firmada incluyendo tu API Key provista en el encabezado <code className="bg-[#111111] px-1.5 py-0.5 rounded text-[#8B2635] font-mono">Authorization</code> como un Token Bearer.
            </p>
            <div className="bg-[#111111] border border-[#2a2a2a] p-4 rounded-sm font-mono text-xs text-[#e8ddd0]">
              Authorization: Bearer cnb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </div>
            <p className="text-xs text-[#d4c5b0]/50 mt-3">
              ⚠️ Las claves API deben resguardarse en el backend de tu servidor y nunca exponerse en código cliente front-end expuesto en navegadores.
            </p>
          </div>

          {/* Endpoints */}
          <div id="endpoints" className="scroll-mt-24 border-t border-[#2a2a2a] pt-10 flex flex-col gap-12">
            
            {/* POST /try-on */}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="bg-[#8B2635] text-[#f5f0eb] text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase">POST</span>
                <code className="text-[#f5f0eb] text-lg font-bold">/api/v1/fitting/try-on</code>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Este endpoint envía la foto del usuario y las imágenes de las prendas a procesar de forma inmediata.
              </p>

              <h4 className="text-[#f5f0eb] font-bold text-xs uppercase tracking-wider mb-3">Parámetros del Body (JSON)</h4>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[500px] text-xs text-left border-collapse border border-[#2a2a2a] mb-6">
                  <thead>
                    <tr className="bg-[#111111] text-[#d4c5b0] border-b border-[#2a2a2a]">
                      <th className="p-3 border-r border-[#2a2a2a] w-1/4">Campo</th>
                      <th className="p-3 border-r border-[#2a2a2a] w-1/4">Tipo</th>
                      <th className="p-3">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#2a2a2a]">
                      <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#d4c5b0]">userPhoto</td>
                      <td className="p-3 border-r border-[#2a2a2a] font-mono">String</td>
                      <td className="p-3">URL pública de la foto del usuario o cadena en formato Base64. Requerido.</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#d4c5b0]">garments</td>
                      <td className="p-3 border-r border-[#2a2a2a] font-mono">Array [String]</td>
                      <td className="p-3">Array conteniendo de 1 a 5 URLs públicas o Base64 de las prendas que vestirá. Requerido.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ejemplo en Fetch */}
              <h4 className="text-[#f5f0eb] font-bold text-xs uppercase tracking-wider mb-3">Ejemplo en JavaScript (Fetch)</h4>
              <div className="bg-[#111111] border border-[#2a2a2a] p-5 rounded-sm overflow-x-auto font-mono text-xs text-[#e8ddd0] leading-relaxed mb-6">
                <pre>{codeFetch}</pre>
              </div>

              {/* Ejemplo en Python */}
              <h4 className="text-[#f5f0eb] font-bold text-xs uppercase tracking-wider mb-3">Ejemplo en Python</h4>
              <div className="bg-[#111111] border border-[#2a2a2a] p-5 rounded-sm overflow-x-auto font-mono text-xs text-[#e8ddd0] leading-relaxed">
                <pre>{codePython}</pre>
              </div>
            </div>

            {/* GET /status/:jobId */}
            <div id="status" className="scroll-mt-24 pt-6 border-t border-[#2a2a2a]/40">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="bg-[#8B2635]/80 text-[#f5f0eb] text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase">GET</span>
                <code className="text-[#f5f0eb] text-lg font-bold">/api/v1/fitting/status/[jobId]</code>
              </div>
              <p className="text-sm leading-relaxed">
                En integraciones complejas de larga duración asíncronas, este endpoint permite consultar el estado actual de un trabajo de procesamiento usando el `jobId` provisto en la petición inicial.
              </p>
            </div>

            {/* GET /usage */}
            <div id="usage" className="scroll-mt-24 pt-6 border-t border-[#2a2a2a]/40">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="bg-[#8B2635]/80 text-[#f5f0eb] text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-sm uppercase">GET</span>
                <code className="text-[#f5f0eb] text-lg font-bold">/api/v1/usage</code>
              </div>
              <p className="text-sm leading-relaxed">
                Consulta las estadísticas de uso y el estado de la API Key, indicando el plan contratado, las peticiones consumidas del mes en curso y el límite asignado.
              </p>
            </div>

          </div>

          {/* Rate Limiting */}
          <div id="rate-limits" className="scroll-mt-24 border-t border-[#2a2a2a] pt-10">
            <h2 className="text-2xl font-serif font-light text-[#f5f0eb] tracking-wide mb-4">3. Límites y Cabeceras (Rate Limiting)</h2>
            <p className="text-sm leading-relaxed mb-6">
              Cada respuesta devuelta por el servidor contiene metadatos relativos al consumo en sus encabezados HTTP (Headers) para permitirte controlar el nivel de llamadas:
            </p>
            <ul className="flex flex-col gap-3 text-sm mb-6 pl-4 border-l-2 border-[#8B2635]">
              <li><code className="text-[#d4c5b0] font-mono">X-RateLimit-Limit</code>: El número total de peticiones asignadas mensualmente según tu plan.</li>
              <li><code className="text-[#d4c5b0] font-mono">X-RateLimit-Remaining</code>: El número de solicitudes que te quedan disponibles en el mes.</li>
            </ul>
            <p className="text-sm leading-relaxed">
              Si consumes tu cupo mensual, los siguientes llamados REST devolverán un código de respuesta HTTP <strong className="text-[#f5f0eb]">429 Too Many Requests</strong> hasta el primer día del mes siguiente, momento en que los contadores son automáticamente reiniciados a cero.
            </p>
          </div>

          {/* Códigos de Error */}
          <div id="errors" className="scroll-mt-24 border-t border-[#2a2a2a] pt-10">
            <h2 className="text-2xl font-serif font-light text-[#f5f0eb] tracking-wide mb-4">4. Códigos de Estado y Errores</h2>
            <p className="text-sm leading-relaxed mb-6">
              La API utiliza códigos estándar de estado HTTP para indicar el éxito o fracaso de las llamadas:
            </p>
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[550px] text-xs text-left border-collapse border border-[#2a2a2a]">
                <thead>
                  <tr className="bg-[#111111] text-[#d4c5b0] border-b border-[#2a2a2a]">
                    <th className="p-3 border-r border-[#2a2a2a] w-1/4">Status</th>
                    <th className="p-3 border-r border-[#2a2a2a] w-1/4">Significado</th>
                    <th className="p-3">Causa Común</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#2a2a2a]">
                    <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#d4c5b0] font-bold">200 OK</td>
                    <td className="p-3 border-r border-[#2a2a2a] font-medium text-[#f5f0eb]">Éxito</td>
                    <td className="p-3">El procesamiento de la prenda fue exitoso y se devuelve la imagen temporal de resultado.</td>
                  </tr>
                  <tr className="border-b border-[#2a2a2a]">
                    <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#a0522d] font-bold">400 Bad Request</td>
                    <td className="p-3 border-r border-[#2a2a2a] font-medium text-[#f5f0eb]">Solicitud Inválida</td>
                    <td className="p-3">Faltan parámetros obligatorios (`userPhoto`, `garments`), o se enviaron más de 5 prendas.</td>
                  </tr>
                  <tr className="border-b border-[#2a2a2a]">
                    <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#a0522d] font-bold">401 Unauthorized</td>
                    <td className="p-3 border-r border-[#2a2a2a] font-medium text-[#f5f0eb]">No Autorizado</td>
                    <td className="p-3">El encabezado de autorización falta, no tiene formato Bearer, o la clave API es inválida o inactiva.</td>
                  </tr>
                  <tr className="border-b border-[#2a2a2a]">
                    <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#a0522d] font-bold">429 Too Many Requests</td>
                    <td className="p-3 border-r border-[#2a2a2a] font-medium text-[#f5f0eb]">Límite Superado</td>
                    <td className="p-3">El cliente consumió todas las peticiones mensuales de su plan.</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-r border-[#2a2a2a] font-mono text-[#8B2635] font-bold">500 Internal Error</td>
                    <td className="p-3 border-r border-[#2a2a2a] font-medium text-[#f5f0eb]">Error de Servidor</td>
                    <td className="p-3">Error inesperado en los procesadores del servidor. El error se reporta de forma interna en logs.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#0a0a0a]/80 py-12 px-4 text-center text-[#d4c5b0]/40 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-semibold">© 2025 CnB. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#f5f0eb] transition-colors">Volver al Inicio</Link>
            <Link href="/stores" className="hover:text-[#f5f0eb] transition-colors">Ver Experiencias de compra</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

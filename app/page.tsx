import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">KSKominíci</h1>
            </div>
            <div>
              <Link
                href="/login"
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Přihlásit se
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Kominické služby<br />
              <span className="text-gray-300">všeho druhu</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Pravidelné kontroly spalinových cest, vložkování komínů
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#kontakt"
                className="bg-white text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Kontaktujte nás
              </a>
              <a
                href="#sluzby"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-black transition-colors duration-200"
              >
                Naše služby
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="sluzby" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Naše služby</h2>
            <p className="text-xl text-gray-300">Kompletní kominické služby pro vaši bezpečnost</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-xl font-bold mb-4 text-white">Montáže a vložkování</h3>
              <p className="text-gray-300 mb-4">Třívrstvé komíny - profesionální montáž a vložkování komínových systémů podle nejnovějších standardů a norem.</p>
              <ul className="text-gray-400 space-y-2">
                <li>• Nerezové vložky</li>
                <li>• Keramické systémy</li>
                <li>• Třívrstvé komíny</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-xl font-bold mb-4 text-white">Kouřovody a kondenzační systémy</h3>
              <p className="text-gray-300 mb-4">Kouřovody, systémy pro kondenzační kotle - instalace a údržba moderních topných systémů.</p>
              <ul className="text-gray-400 space-y-2">
                <li>• Kondenzační kotle</li>
                <li>• Plastové kouřovody</li>
                <li>• Nerezové systémy</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-xl font-bold mb-4 text-white">Pravidelné kontroly</h3>
              <p className="text-gray-300 mb-4">Pravidelné kontroly dle nařízení vlády č. 91/2010 Sb. - zajišťujeme bezpečnost vašich spalinových cest.</p>
              <ul className="text-gray-400 space-y-2">
                <li>• Roční kontroly</li>
                <li>• Čištění komínů</li>
                <li>• Kontrola těsnosti</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-xl font-bold mb-4 text-white">Revizní zprávy</h3>
              <p className="text-gray-300 mb-4">Kompletní dokumentace a revizní zprávy - všechna potřebná dokumentace pro pojišťovny a úřady.</p>
              <ul className="text-gray-400 space-y-2">
                <li>• Protokoly o kontrole</li>
                <li>• Kominické průkazy</li>
                <li>• Certifikáty</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Proč si vybrat KSKominíci?</h2>
              <div className="space-y-4 text-lg text-gray-300">
                <p>
                  Jsme tým zkušených kominíků s dlouholetou praxí v oboru. Specializujeme se na 
                  kompletní kominické služby od montáží až po pravidelné kontroly.
                </p>
                <p>
                  Naše práce odpovídá všem platným normám a předpisům. Poskytujeme komplexní 
                  služby včetně všech potřebných dokumentů a certifikátů.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">15+</div>
                  <div className="text-gray-400">Let zkušeností</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">500+</div>
                  <div className="text-gray-400">Spokojených zákazníků</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Naše certifikace</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Oprávnění dle zákona č. 133/1985 Sb.
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Certifikace pro práci s plynovými zařízeními
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Pojištění profesní odpovědnosti
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  IČO: 87484510
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakt" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Kontakt</h2>
            <p className="text-xl text-gray-300">Ozvěte se nám pro nezávaznou konzultaci</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Kontaktní údaje</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                      <span className="text-black text-sm">📍</span>
                    </div>
                    <div>
                      <p className="font-semibold">Adresa</p>
                      <p className="text-gray-300">Seradovská 435, 251 65 Ondřejov</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Naši specialisté</h3>
                <div className="space-y-6">
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="font-bold text-lg mb-2">Tomáš Kračmer</h4>
                    <div className="space-y-2 text-gray-300">
                      <p className="flex items-center">
                        <span className="w-4 h-4 mr-2">📞</span>
                        <a href="tel:+420721977044" className="hover:text-white transition-colors">+420 721 977 044</a>
                      </p>
                      <p className="flex items-center">
                        <span className="w-4 h-4 mr-2">✉️</span>
                        <a href="mailto:kracmer.tom@gmail.com" className="hover:text-white transition-colors">kracmer.tom@gmail.com</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="font-bold text-lg mb-2">Jakub Štěpánek</h4>
                    <div className="space-y-2 text-gray-300">
                      <p className="flex items-center">
                        <span className="w-4 h-4 mr-2">📞</span>
                        <a href="tel:+420776724300" className="hover:text-white transition-colors">+420 776 724 300</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Pošlete nám zprávu</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Jméno</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Vaše jméno"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="vas@email.cz"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="+420 XXX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">Zpráva</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Popište váš požadavek..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 px-6 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Odeslat zprávu
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">KSKominíci</h3>
            <p className="text-gray-400 mb-4">Profesionální kominické služby</p>
            <div className="flex justify-center space-x-6 mb-6">
              <a href="#sluzby" className="text-gray-400 hover:text-white transition-colors">Služby</a>
              <a href="#kontakt" className="text-gray-400 hover:text-white transition-colors">Kontakt</a>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Přihlášení</Link>
            </div>
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-500">© 2024 KSKominíci. Všechna práva vyhrazena.</p>
              <p className="text-gray-500 mt-2">IČO: 87484510</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
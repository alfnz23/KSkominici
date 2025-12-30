import Link from 'next/link'
import ContactForm from '@/app/components/ContactForm'


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

      {/* Services Section - MODERNIZED LAYOUT */}
      <section id="sluzby" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Naše služby</h2>
            <p className="text-xl text-gray-300">Kompletní kominické služby pro vaši bezpečnost</p>
          </div>
          
          {/* Service Cards - Better Layout */}
          <div className="space-y-8">
            {/* Row 1: Montáže + Pravidelné kontroly */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Montáže a vložkování */}
              <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200 h-full">
                <h3 className="text-2xl font-bold mb-4 text-white">Montáže a vložkování</h3>
                <p className="text-gray-300 mb-6">Třívrstvé komíny - profesionální montáž a vložkování komínových systémů podle nejnovějších standardů a norem.</p>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Nerezové vložky</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Plastové vložky</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Třívrstvé komíny pro kondenzační kotle i tuhá paliva</span>
                  </li>
                </ul>
              </div>

              {/* Pravidelné kontroly */}
              <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200 h-full">
                <h3 className="text-2xl font-bold mb-4 text-white">Pravidelné kontroly</h3>
                <p className="text-gray-300 mb-6">Pravidelné kontroly dle nařízení vlády č. 91/2010 Sb. - zajišťujeme bezpečnost vašich spalinových cest.</p>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Roční kontroly</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Čištění komínů</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-white mr-2">•</span>
                    <span>Automatické připomínání vypršení platnosti zpráv o provedení kontroly - nemusíte na nic myslet, náš systém si to hlídá za vás</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Row 2: Práce ve výškách - FULL WIDTH */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-2xl font-bold mb-4 text-white">Práce ve výškách a montáž komínových systémů</h3>
              <p className="text-gray-300 mb-8">Provádíme odborné práce ve výškách pomocí lanové techniky se specializací na montáž, demontáž a rekonstrukce komínových systémů.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Montáž komínů pro velké zdroje */}
                <div className="bg-black/30 p-6 rounded-lg">
                  <h4 className="font-bold text-white mb-3 text-lg">Montáž komínů pro velké zdroje</h4>
                  <p className="text-gray-400 text-sm mb-3">Realizujeme komínové systémy pro kotelny a technologické celky:</p>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Plynové a pevnopalivové kotelny</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Velké tepelné zdroje</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Průmyslové provozy</span>
                    </li>
                  </ul>
                </div>

                {/* Komínové systémy ve světlících */}
                <div className="bg-black/30 p-6 rounded-lg">
                  <h4 className="font-bold text-white mb-3 text-lg">Komínové systémy ve světlících</h4>
                  <p className="text-gray-400 text-sm mb-3">Instalace komínů ve vnitřních světlících:</p>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Nové komínové vložky a systémy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Víceprůduchové i samostatné komíny</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Práce bez zásahu do provozu objektu</span>
                    </li>
                  </ul>
                </div>

                {/* Demontáž a výměna */}
                <div className="bg-black/30 p-6 rounded-lg">
                  <h4 className="font-bold text-white mb-3 text-lg">Demontáž a výměna starých komínů</h4>
                  <p className="text-gray-400 text-sm mb-3">Provádíme demontáž nevyhovujících komínů:</p>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Ve světlících</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>Na fasádách domů</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-white mr-2 text-xs">•</span>
                      <span>V těžko přístupných místech</span>
                    </li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-3">Následně zajišťujeme náhradu moderním certifikovaným systémem.</p>
                </div>

                {/* Výhody lanové techniky */}
                <div className="bg-black/30 p-6 rounded-lg">
                  <h4 className="font-bold text-white mb-3 text-lg">Výhody lanové techniky</h4>
                  <ul className="text-gray-400 text-sm space-y-2 mt-4">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Minimální zásah do objektu</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Bez omezení provozu budovy</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Kratší doba realizace</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span>Nižší celkové náklady</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Row 3: Revizní zprávy - FULL WIDTH */}
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200">
              <h3 className="text-2xl font-bold mb-4 text-white">Revizní zprávy</h3>
              <p className="text-gray-300 mb-6">Kompletní dokumentace a revizní zprávy - všechna potřebná dokumentace pro pojišťovny a úřady.</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-gray-400">
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>Protokoly o kontrole</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>Výchozí revizní zprávy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>Certifikáty</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">•</span>
                  <span>Výpočty spalinových cest</span>
                </li>
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
                  Pojištění profesní odpovědnosti
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Zkušenosti s technicky náročnými realizacemi
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  Certifikovaná lanová technika
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
                      <p className="text-gray-300">Dražice 85, Benátky nad Jizerou</p>
                      <p className="text-gray-300 text-sm mt-1">Seradovská 435, 251 65 Ondřejov</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Naši specialisté</h3>
                <div className="space-y-6">
                  {/* Tomáš Kračmer */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="font-bold text-lg mb-3 text-white">Tomáš Kračmer</h4>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">📞</span>
                        <a href="tel:+420721977044" className="hover:text-white transition-colors">+420 721 977 044</a>
                      </p>
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">✉️</span>
                        <a href="mailto:kracmer.tom@gmail.com" className="hover:text-white transition-colors">kracmer.tom@gmail.com</a>
                      </p>
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">🏢</span>
                        <span>IČO: 87484510</span>
                      </p>
                      <p className="flex items-start mt-3 pt-3 border-t border-gray-700">
                        <span className="w-5 h-5 mr-2 mt-0.5">📍</span>
                        <span>
                          <span className="font-semibold text-white block mb-1">Oblast působnosti:</span>
                          Praha / Praha východ / okres Benešov a okolí
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Jakub Štěpánek */}
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h4 className="font-bold text-lg mb-3 text-white">Jakub Štěpánek</h4>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">📞</span>
                        <a href="tel:+420776724300" className="hover:text-white transition-colors">+420 776 724 300</a>
                      </p>
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">✉️</span>
                        <a href="mailto:kominici.stepanek@email.cz" className="hover:text-white transition-colors">kominici.stepanek@email.cz</a>
                      </p>
                      <p className="flex items-center">
                        <span className="w-5 h-5 mr-2">🏢</span>
                        <span>IČO: 88054667</span>
                      </p>
                      <p className="flex items-start mt-3 pt-3 border-t border-gray-700">
                        <span className="w-5 h-5 mr-2 mt-0.5">📍</span>
                        <span>
                          <span className="font-semibold text-white block mb-1">Oblast působnosti:</span>
                          Praha / Praha východ / okres Mladá Boleslav a okolí
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-6">Pošlete nám zprávu</h3>
              <ContactForm />
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

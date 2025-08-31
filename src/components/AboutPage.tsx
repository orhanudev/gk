import React from 'react';
import { Play, Search, List, Folder, Video, Check, Download, Smartphone } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo.png" alt="Gözden Kalbe Logo" className="w-16 h-16 mr-4" />
          <h1 className="text-4xl font-bold text-white">Gözden Kalbe</h1>
        </div>
        <p className="text-xl text-gray-300">Video Streaming Platformu</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Temel Özellikler */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Smartphone className="w-6 h-6 mr-3 text-purple-400" />
            Temel Özellikler
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <Folder className="w-5 h-5 mr-3 mt-0.5 text-purple-400 flex-shrink-0" />
              <div>
                <strong>Hiyerarşik İçerik Yapısı</strong>
                <p className="text-sm text-gray-400">Kategoriler ve alt kategoriler ile düzenli video organizasyonu</p>
              </div>
            </li>
            <li className="flex items-start">
              <Play className="w-5 h-5 mr-3 mt-0.5 text-purple-400 flex-shrink-0" />
              <div>
                <strong>YouTube Video Oynatıcı</strong>
                <p className="text-sm text-gray-400">Yerleşik video oynatıcı ile kesintisiz izleme deneyimi</p>
              </div>
            </li>
            <li className="flex items-start">
              <Smartphone className="w-5 h-5 mr-3 mt-0.5 text-purple-400 flex-shrink-0" />
              <div>
                <strong>Mobil Uyumlu Tasarım</strong>
                <p className="text-sm text-gray-400">Telefon, tablet ve masaüstü için optimize edilmiş arayüz</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Oynatma Listeleri */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <List className="w-6 h-6 mr-3 text-green-400" />
            Oynatma Listeleri
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <List className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
              <div>
                <strong>Kişisel Listeler</strong>
                <p className="text-sm text-gray-400">Kendi oynatma listelerinizi oluşturun ve yönetin</p>
              </div>
            </li>
            <li className="flex items-start">
              <Play className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
              <div>
                <strong>Liste Oynatıcı</strong>
                <p className="text-sm text-gray-400">Sıralı video oynatma ve otomatik geçiş</p>
              </div>
            </li>
            <li className="flex items-start">
              <Check className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
              <div>
                <strong>İzleme Takibi</strong>
                <p className="text-sm text-gray-400">Hangi videoları izlediğinizi işaretleyin</p>
              </div>
            </li>
            <li className="flex items-start">
              <Video className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
              <div>
                <strong>Toplu Liste Oluşturma</strong>
                <p className="text-sm text-gray-400">Tüm kategori videolarını tek seferde listeye ekleyin</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Arama ve Keşif */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Search className="w-6 h-6 mr-3 text-blue-400" />
            Arama ve Keşif
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <Search className="w-5 h-5 mr-3 mt-0.5 text-blue-400 flex-shrink-0" />
              <div>
                <strong>Yerel Video Arama</strong>
                <p className="text-sm text-gray-400">Tüm kategorilerdeki videolar arasında arama yapın</p>
              </div>
            </li>
            <li className="flex items-start">
              <Search className="w-5 h-5 mr-3 mt-0.5 text-blue-400 flex-shrink-0" />
              <div>
                <strong>YouTube Arama</strong>
                <p className="text-sm text-gray-400">Doğrudan YouTube'da yeni videolar bulun</p>
              </div>
            </li>
            <li className="flex items-start">
              <Play className="w-5 h-5 mr-3 mt-0.5 text-blue-400 flex-shrink-0" />
              <div>
                <strong>YouTube URL Girişi</strong>
                <p className="text-sm text-gray-400">Herhangi bir YouTube linkini doğrudan oynatın</p>
              </div>
            </li>
            <li className="flex items-start">
              <Download className="w-5 h-5 mr-3 mt-0.5 text-blue-400 flex-shrink-0" />
              <div>
                <strong>YouTube Liste İçe Aktarma</strong>
                <p className="text-sm text-gray-400">YouTube oynatma listelerini tek seferde içe aktarın</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Kullanıcı Deneyimi */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Video className="w-6 h-6 mr-3 text-orange-400" />
            Kullanıcı Deneyimi
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <Folder className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
              <div>
                <strong>Breadcrumb Navigasyon</strong>
                <p className="text-sm text-gray-400">Nerede olduğunuzu her zaman bilin</p>
              </div>
            </li>
            <li className="flex items-start">
              <Smartphone className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
              <div>
                <strong>Responsive Tasarım</strong>
                <p className="text-sm text-gray-400">Her ekran boyutunda mükemmel görünüm</p>
              </div>
            </li>
            <li className="flex items-start">
              <List className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
              <div>
                <strong>Hızlı Erişim</strong>
                <p className="text-sm text-gray-400">Ana sayfa, listeler ve arama arasında kolay geçiş</p>
              </div>
            </li>
            <li className="flex items-start">
              <Check className="w-5 h-5 mr-3 mt-0.5 text-orange-400 flex-shrink-0" />
              <div>
                <strong>Yerel Depolama</strong>
                <p className="text-sm text-gray-400">Listeleriniz tarayıcınızda güvenle saklanır</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* İçerik Yönetimi */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Folder className="w-6 h-6 mr-3 text-indigo-400" />
          İçerik Yönetimi
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <Folder className="w-5 h-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
              <div>
                <strong>Kategori Bazlı Organizasyon</strong>
                <p className="text-sm text-gray-400">Çocuk, müzik, film gibi ana kategoriler</p>
              </div>
            </li>
            <li className="flex items-start">
              <Folder className="w-5 h-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
              <div>
                <strong>Alt Kategori Desteği</strong>
                <p className="text-sm text-gray-400">Sınırsız seviyede alt kategori yapısı</p>
              </div>
            </li>
          </ul>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <Video className="w-5 h-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
              <div>
                <strong>Video Sayacı</strong>
                <p className="text-sm text-gray-400">Her kategoride kaç video olduğunu görün</p>
              </div>
            </li>
            <li className="flex items-start">
              <List className="w-5 h-5 mr-3 mt-0.5 text-indigo-400 flex-shrink-0" />
              <div>
                <strong>Kolay İçerik Ekleme</strong>
                <p className="text-sm text-gray-400">JSON dosyaları ile hızlı içerik güncelleme</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-gray-700">
        <p className="text-gray-400">
          Gözden Kalbe - Video izleme deneyiminizi kişiselleştirin
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Tüm videolar YouTube'dan oynatılmaktadır
        </p>
      </div>
    </div>
  );
}
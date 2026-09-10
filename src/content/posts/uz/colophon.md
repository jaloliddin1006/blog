---
title: 'Kolofon: bu sayt qanday qurilgan'
date: 2026-09-10
lang: uz
summary: 'Sayt ortidagi texnologiyalar haqida qisqa yozuv: Astro, o‘z serverimizdagi shriftlar, JSON kontent va statik hosting.'
---

Bu sayt ataylab kichik qilib qurilgan. U statik tarzda yig‘iladi — server ham, ma’lumotlar bazasi ham, brauzer tomonidagi framework ham yo‘q — va ko‘rsatilayotgan hamma narsa repozitoriydagi bir nechta fayldan olinadi.

## Texnologiyalar

- **Astro** sahifalarni deploy paytida oddiy HTML holiga keltiradi. Brauzerga yetib boradigan yagona JavaScript — mavzu almashtirgichi, til almashtirgichi va chop etish tugmasi.
- **Tailwind CSS** uslublarni beradi, lekin har bir rang kichik CSS o‘zgaruvchilar to‘plamidan olinadi, shu sabab yorug‘ va qorong‘i mavzular bir-biriga mos qoladi.
- **IBM Plex** Serif, Sans va Mono shriftlari o‘z serverimizda saqlanadi hamda faqat lotin va kirill qismlariga qisqartirilgan. Hech qanday shrift CDN so‘ralmaydi.

## Kontent

Matn JSON fayllarda turadi — profil, ish tajribasi, loyihalar, sertifikatlar, ko‘nikmalar — har bir maydon ingliz, o‘zbek va rus tilidagi variantini oladi. `/cv/` manzilidagi rezyume sahifasi bosh sahifa bilan bir xil fayllardan yig‘iladi, shuning uchun ular hech qachon bir-biriga zid bo‘lmaydi.

Mana shunday yozuvlar esa kichik frontmatterga ega Markdown fayllar. Yangisini qo‘shish uchun bitta fayl va bitta commit yetarli.

## Nega aynan shunday

Uch til, surat, ish tajribasi tasmasi, oltita repozitoriy va bog‘lanish uchun yo‘l. Tez eskiradigan narsalar — obunachilar soni, yulduzlar soni, foiz ko‘rsatkichli chiziqlar — ataylab qoldirilmadi.

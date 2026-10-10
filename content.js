// Website content that isn't in the Google Sheet. Photos live in site/images/.
window.SUGAR_LANE_CONTENT = {
  social: {
    instagram: 'https://www.instagram.com/sugarlane_ok/',
    facebook: 'https://www.facebook.com/profile.php?id=61563093670906',
    tiktok: ''
  },

  // ---- Showcase galleries (shown in this order on the home page) ----
  // [file, description]. The first `featured` photos show right away; the rest appear with "See more".
  showcase: {
    cookies: {
      featured: 12,
      photos: [
        ['cookies-pink-grad.jpg', 'Pink and gold class of 2026 graduation cookies'],
        ['cookies-pooh-baby-shower.jpg', 'Winnie the Pooh baby shower cookies'],
        ['cookies-tropical-baby-shower.jpg', 'Tropical flamingo baby shower cookie set'],
        ['cookies-cherry-baby.jpg', '"She’s the cherry on top" baby shower cookies'],
        ['cookies-washburn-grad.jpg', 'Washburn University graduation cookies'],
        ['cookies-hatching-soon.jpg', '"Hatching soon" dinosaur baby shower cookies'],
        ['cookies-teacher.jpg', 'Teacher appreciation cookies with apples, rainbows and flowers'],
        ['cookies-sage-wedding.jpg', 'Sage and blush wedding cookies'],
        ['cookies-nurse-grad.jpg', 'Maroon nursing school graduation cookies'],
        ['cookies-boots-bubbly.jpg', '"Boots, booze and I do\'s" bachelorette cookies'],
        ['cookies-navy-gold-grad.jpg', 'Navy and gold graduation cookies'],
        ['cookies-dino-atlas.jpg', 'Dinosaur birthday cookies'],
        ['cookies-first-birthday.jpg', 'Pastel first birthday cookies'],
        ['cookies-engagement.jpg', 'Emerald and gold engagement cookies'],
        ['cookies-yellow-grad.jpg', 'Black and yellow graduation cookies'],
        ['cookies-ou-grad.jpg', 'Boomer Sooner graduation cookies'],
        ['cookies-pink-green-grad.jpg', 'Pink and green graduation cookies'],
        ['cookies-pooh-box.jpg', 'Winnie the Pooh cookies in a gold box'],
        ['cookies-electrician.jpg', 'Electrician-themed cookies with light bulbs and outlets'],
        ['cookies-western-bridal.jpg', 'Western cowboy boot bridal cookies'],
        ['cookies-monogram-wedding.jpg', 'Monogram wedding cookies'],
        ['cookies-bridal-shower.jpg', 'White and sage bridal shower cookies'],
        ['cookies-49th-birthday.jpg', 'Red and pink bow birthday cookies'],
        ['cookies-tropical-baby-2.jpg', 'Tropical baby shower cookies, close up'],
        ['cookies-tropical-baby-3.jpg', 'Sunglasses and pineapple cookies'],
        ['cookies-pink-grad-2.jpg', 'Pink graduation cookies, close up'],
        ['cookies-washburn-grad-2.jpg', 'Washburn graduation cookie plate'],
        ['cookies-pooh-baby-shower-2.jpg', 'Pooh and Eeyore baby shower cookies'],
        ['cookies-nurse-grad-2.jpg', 'Nurse graduation cookies, close up'],
        ['cookies-navy-gold-grad-2.jpg', 'Class of 2026 navy and gold cookies'],
        ['cookies-hatching-soon-2.jpg', 'Dinosaur and baby bottle cookies'],
        ['cookies-teacher-2.jpg', 'Teacher appreciation cookie plate'],
        ['cookies-dino-atlas-2.jpg', 'Dinosaur and palm leaf cookies'],
        ['cookies-cherry-baby-2.jpg', 'Cherry and bow baby shower cookie platter']
      ]
    },
    cakepops: {
      layout: 'grid', // photos stay in the order listed (left to right)
      big: 3,         // the first 3 photos show large across the top
      featured: 11,
      // 3rd value = size in the small grid: 'tall' (2 rows), 'wide tall' (2 columns x 2 rows)
      photos: [
        ['pops-fiesta.jpg', 'Fiesta cake pops with tiny sombreros'],
        ['minnie-pops.jpg', 'Minnie bow cake pops in a mason jar'],
        ['pops-toy-story.jpg', 'Toy Story birthday cake pops on a white stand'],
        ['pops-honey-bee-2.jpg', 'Honey bee cake pops with honey dippers'],
        ['pops-pink-tray.jpg', 'Pink bow cake pops on a silver tray', 'tall'],
        ['pops-navy-gold-fan-hd.jpg', 'Navy and gold graduation cake pops fanned on a plate', 'wide tall'],
        ['pops-baby-feet.jpg', 'Pink baby feet cake pops'],
        ['pops-halloween.jpg', 'Halloween cake pops with orange, black and white sprinkles'],
        ['pops-reindeer.jpg', 'Reindeer cake pops with pretzel antlers'],
        ['pops-butterfly.jpg', 'Pink and lavender butterfly Oreo pops'],
        ['pops-patriotic.jpg', 'Red, white and blue Oreo pops'],
        ['pops-grinch.jpg', 'Green cake pops with red hearts'],
        ['pops-pink-gold.jpg', 'Pink, white and gold cake pops'],
        ['pops-dino.jpg', 'Dinosaur Oreo pops'],
        ['pops-purple-gold.jpg', 'Purple and gold Oreo pops'],
        ['pops-ice-cream.jpg', 'Ice cream cone cake pops']
      ]
    },
    cakes: {
      featured: 9,
      photos: [
        ['cake-wedding-tiered.jpg', 'Three-tier white vintage wedding cake'],
        ['cake-heart-wj.jpg', 'White vintage heart cake with gold W & J lettering'],
        ['cake-navy-floral.jpg', 'Navy cake with piped coral roses and spring flowers'],
        ['cupcakes-toy-story-tray.jpg', 'Toy Story character cupcakes on a marble board'],
        ['drip-cake.jpg', 'Caramel drip cake with chocolate pieces'],
        ['cupcakes-rosette.jpg', 'Buttercream rosette cupcakes'],
        ['cake-black-gold.jpg', 'Black and gold birthday cake with gold leaf'],
        ['bow-cake.jpg', 'Pink vintage cake with satin bows'],
        ['cake-cherry-heart.jpg', 'Vintage pink heart cake with cherries'],
        ['cake-vintage-pink.jpg', 'Pink and peach vintage piped birthday cake'],
        ['cake-sweet-sixteen.jpg', 'Pastel vintage sweet sixteen cake'],
        ['cupcakes-floral.jpg', 'Cupcakes with piped buttercream flowers'],
        ['cake-white-gold-bow.jpg', 'White vintage cake with a gold bow'],
        ['cake-peach-rosette.jpg', 'Peach buttercream rosette cake'],
        ['cupcakes-german-chocolate.jpg', 'German chocolate cupcakes'],
        ['cake-minnie.jpg', 'Minnie Mouse ears cake with red hearts and a polka-dot bow'],
        ['cake-ruffle.jpg', 'White ruffle cake'],
        ['cake-wedding-tiered-2.jpg', 'Vintage wedding cake detail']
      ]
    }
  },

  // ---- Menu card photo for each group (part of the Menu tab's Category before " – ") ----
  // A list makes a collage. Missing = branded placeholder.
  photos: {
    'Classic Cookies': 'images/flavor-chocolate-chip-styled.jpg',
    'Specialty Cookies': 'images/flavor-cookies-styled.jpg',
    'Cupcakes': 'images/cupcakes-rosette.jpg',
    'Cake Pops': 'images/pops-honey-bee.jpg',
    'Party Packs': 'images/party-pack-wide.jpg'
  },

  // ---- Photos for individual menu items, shown when someone taps that item ----
  // Key: "Category|Item" exactly as in the Menu tab, or "Category|*" for every item in that category.
  itemPhotos: {
    'Cake Pops|*': ['pops-honey-bee.jpg', 'pops-fiesta.jpg', 'pops-baby-feet.jpg', 'pops-pink-tray.jpg', 'pops-navy-gold-fan-hd.jpg', 'pops-honey-bee-2.jpg', 'minnie-pops.jpg', 'pops-halloween.jpg', 'pops-reindeer.jpg', 'pops-pink-gold.jpg', 'pops-grinch.jpg', 'pops-ice-cream.jpg'],
    'Cupcakes – Classic|*': ['cupcakes-rosette.jpg', 'cupcakes-floral.jpg', 'cupcakes-toy-story.jpg', 'toy-story-party.jpg'],
    'Cupcakes – Specialty|*': ['cupcakes-floral.jpg', 'cupcakes-rosette.jpg'],
    'Party Packs|*': ['flavor-assortment.jpg', 'flavor-assortment-2.jpg']
  },

  blurbs: {
    'Classic Cookies': 'Big, soft, bakery-style cookies. The classics, done right.',
    'Specialty Cookies': 'Loaded, over-the-top cookies. Our fan favorites.',
    'Mini Cookies': 'Bite-size versions of our cookies – perfect for parties and dessert tables.',
    'Cupcakes': 'Fluffy cupcakes with Swiss meringue buttercream, decorated to match your party.',
    'Cake Pops': 'Dipped, decorated and ready for photos. Tell us your colors and theme!',
    'Party Packs': 'Mix and match dozens of cookies, cake pops, brownies, dipped Rice Krispie treats or pretzel rods. Great for birthdays, tailgates and showers.'
  },

  // ---- Order page sections. Each menu group goes in the first section whose "match" (a regex) fits its name. ----
  // "custom" adds a card that opens the custom request form.
  // ---- Seasonal presale page: the season's name in the Seasonal tab picks one of these looks ----
  // colors: one per box (white text sits on them, so keep them deep). bg/stripe: the striped page background.
  seasonThemes: [
    { match: 'hallow|spooky|boo', subtitle: 'Cookie Presale', tagline: 'Spooky sweets from our kitchen',
      ornament: ['\ud83e\udd87', '\ud83e\udd87'], emoji: ['\ud83c\udf83', '\ud83d\udc7b', '\ud83d\udd78\ufe0f', '\ud83e\udd87'],
      colors: ['#c4501a', '#6f5478', '#55613f'], bg: '#fbefe0', stripe: '#f5e2c9' },
    { match: 'thank|fall|autumn|harvest|friendsgiving', subtitle: 'Cookie Presale', tagline: 'Grateful for every bite',
      ornament: ['\ud83c\udf42', '\ud83c\udf42'], emoji: ['\ud83e\udd67', '\ud83e\udd83', '\ud83c\udf41', '\ud83c\udf3e'],
      colors: ['#a24a24', '#8a5d14', '#5f4330'], bg: '#fbf0e3', stripe: '#f3e1cb' },
    { match: 'christmas|holiday|xmas|winter|noel', subtitle: 'Cookie Presale', tagline: 'Merry little treats',
      ornament: ['\u2744\ufe0f', '\u2744\ufe0f'], emoji: ['\ud83c\udf84', '\ud83c\udf81', '\u26c4', '\ud83c\udf6a'],
      colors: ['#b3262e', '#2d6a47', '#7a5f18'], bg: '#fbf2ee', stripe: '#f2e0da' },
    { match: 'valentine|galentine|love', subtitle: 'Cookie Presale', tagline: 'Baked with love',
      ornament: ['\ud83d\udc8c', '\ud83d\udc8c'], emoji: ['\ud83d\udc95', '\ud83c\udf39', '\ud83d\udc8c', '\ud83d\udc9d'],
      colors: ['#c2185b', '#8f1838', '#a33d78'], bg: '#fff1f5', stripe: '#ffe0ea' },
    { match: 'easter|spring|bunny', subtitle: 'Cookie Presale', tagline: 'Hoppy little treats',
      ornament: ['\ud83c\udf37', '\ud83c\udf37'], emoji: ['\ud83d\udc23', '\ud83c\udf37', '\ud83d\udc30', '\ud83e\udd5a'],
      colors: ['#7a5fb0', '#3b7d62', '#93611a'], bg: '#f6f2fb', stripe: '#ebe3f6' },
    { match: 'grad|class of|senior', subtitle: 'Cookie Presale', tagline: 'Celebrate your grad',
      ornament: ['\ud83c\udf93', '\ud83c\udf93'], emoji: ['\ud83c\udf93', '\u2b50', '\ud83d\udcdc', '\ud83c\udf89'],
      colors: ['#22324f', '#806410', '#b0105c'], bg: '#f3f4f8', stripe: '#e4e8f0' },
    { match: 'mother|mom', subtitle: 'Cookie Presale', tagline: 'Sweet treats for sweet moms',
      ornament: ['\ud83c\udf38', '\ud83c\udf38'], emoji: ['\ud83d\udc90', '\ud83c\udf38', '\ud83c\udf37'],
      colors: ['#b8336a', '#6f4f99', '#3b7356'], bg: '#fff3f7', stripe: '#fae1eb' },
    { match: 'july|4th|fourth|independence|summer', subtitle: 'Cookie Presale', tagline: 'Red, white and sweet',
      ornament: ['\u2b50', '\u2b50'], emoji: ['\ud83c\udf86', '\u2b50', '\ud83c\uddfa\ud83c\uddf8'],
      colors: ['#b3262e', '#23407a', '#4f5d6b'], bg: '#f4f6fb', stripe: '#e3e8f2' },
    { match: 'school|teacher', subtitle: 'Cookie Presale', tagline: 'Sweet treats for the new year',
      ornament: ['\ud83c\udf4e', '\ud83c\udf4e'], emoji: ['\ud83c\udf4e', '\u270f\ufe0f', '\ud83d\udcda'],
      colors: ['#b3262e', '#2d6a47', '#7f5810'], bg: '#f7f5ef', stripe: '#ebe6d8' }
  ],
  seasonDefault: { subtitle: 'Presale', tagline: 'Limited-time treats from our kitchen',
    ornament: ['\u2726', '\u2726'], emoji: ['\ud83c\udf6a', '\ud83e\uddc1', '\ud83c\udf82'],
    colors: ['#c2006a', '#7a3f63', '#9c3b67'], bg: '#fff4f8', stripe: '#ffe5ef' },

  menuSections: [
    { id: 'custom', title: 'Custom orders', lead: 'Our specialty and most-requested treats, designed around your party. Tell us your idea and we\'ll send a quote.',
      customs: [
        { name: 'Decorated Cookies', price: 'From $45 / dozen', photo: 'images/cookies-pooh-baby-shower-2.jpg', pos: '50% 85%', tag: 'Most popular',
          blurb: 'Royal-iced sugar cookies in your colors, shapes and names.' },
        { name: 'Custom Cakes & Cupcakes', price: 'From $30', photo: 'images/cake-wedding-tiered.jpg', photo2: 'images/cupcakes-rosette.jpg',
          blurb: 'Round, heart, star, tiered, cookie and wedding cakes, plus cupcakes by the dozen, in Swiss meringue buttercream.' },
        { name: 'Custom Cake Pops', price: 'From $18 / dozen', photo: 'images/tile-pops.jpg', photo2: 'images/pops-honey-bee-2.jpg',
          blurb: 'Dipped and decorated to match your theme.' }
      ] },
    { id: 'seasonal', title: 'Seasonal presale', match: 'presale' },
    { id: 'cookies', title: 'Cookies by the dozen', match: 'cookie' },
    { id: 'treats', title: 'Party Packs', match: '.' }
  ]
};

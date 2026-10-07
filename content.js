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
        ['cookies-dino-atlas-2.jpg', 'Dinosaur and palm leaf cookies']
      ]
    },
    cakepops: {
      layout: 'grid', // photos stay in the order listed (left to right)
      big: 2,         // the first 2 photos show large across the top
      featured: 7,
      // 3rd value = size in the small grid: 'tall' (2 rows), 'wide tall' (2 columns x 2 rows)
      photos: [
        ['pops-fiesta.jpg', 'Fiesta cake pops with tiny sombreros'],
        ['minnie-pops.jpg', 'Minnie bow cake pops in a mason jar'],
        ['pops-pink-tray.jpg', 'Pink bow cake pops on a silver tray', 'tall'],
        ['pops-navy-gold-fan.jpg', 'Navy and gold graduation cake pops fanned on a plate', 'wide tall'],
        ['pops-honey-bee-2.jpg', 'Honey bee cake pops with honey dippers'],
        ['pops-baby-feet.jpg', 'Pink baby feet cake pops']
      ]
    },
    cakes: {
      featured: 6,
      photos: [
        ['cake-wedding-tiered.jpg', 'Three-tier white vintage wedding cake'],
        ['drip-cake.jpg', 'Caramel drip cake with chocolate pieces'],
        ['bow-cake.jpg', 'Pink vintage cake with satin bows'],
        ['cake-vintage-pink.jpg', 'Pink and peach vintage piped birthday cake'],
        ['cake-white-gold-bow.jpg', 'White vintage cake with a gold bow'],
        ['cake-peach-heart.jpg', 'Peach vintage heart cake'],
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
    'Cake Pops': 'images/pops-honey-bee.jpg',
    'Party Packs': ['images/flavor-assortment.jpg', 'images/pops-pink-tray.jpg', 'images/flavor-red-velvet-dipped.jpg']
  },

  // ---- Photos for individual menu items, shown when someone taps that item ----
  // Key: "Category|Item" exactly as in the Menu tab, or "Category|*" for every item in that category.
  itemPhotos: {
    'Classic Cookies|Chocolate Chip': ['flavor-chocolate-chip.jpg', 'flavor-chocolate-chip-styled.jpg', 'chocolate-chip.jpg'],
    'Classic Cookies|M&M': ['flavor-mm.jpg'],
    'Specialty Cookies|M&M': ['flavor-mm.jpg'],
    'Classic Cookies|Iced Lemon': ['flavor-iced-lemon.jpg'],
    'Specialty Cookies|Big Bubba': ['big-bubba.jpg'],
    'Specialty Cookies|Mr. Gibbs': ['flavor-mr-gibbs.jpg'],
    'Specialty Cookies|White Chocolate Dipped Red Velvet': ['flavor-red-velvet-dipped.jpg', 'flavor-red-velvet-dipped-2.jpg'],
    'Specialty Cookies|White Chocolate Dipped Sugar Cookie': ['flavor-sugar-dipped.jpg'],
    'Cake Pops|*': ['pops-honey-bee.jpg', 'pops-fiesta.jpg', 'pops-baby-feet.jpg', 'pops-pink-tray.jpg', 'pops-navy-gold-fan.jpg', 'pops-honey-bee-2.jpg', 'minnie-pops.jpg'],
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
  menuSections: [
    { id: 'custom', title: 'Custom orders', lead: 'Our specialty and most-requested treats, designed around your party. Tell us your idea and we\'ll send a quote.',
      customs: [
        { name: 'Decorated Cookies', price: 'From $45 / dozen', photo: 'images/cookies-pink-grad.jpg', tag: 'Most popular',
          blurb: 'Royal-iced sugar cookies in your colors, shapes and names.' },
        { name: 'Custom Cakes', price: 'From $30', photo: 'images/cake-wedding-tiered.jpg',
          blurb: 'Round, heart, star, tiered, cookie and wedding cakes in Swiss meringue buttercream.' },
        { name: 'Custom Cake Pops', price: 'Quoted by design', photo: 'images/tile-pops.jpg',
          blurb: 'Dipped and decorated to match your theme.' }
      ] },
    { id: 'cookies', title: 'Cookies by the dozen', match: 'cookie' },
    { id: 'cakes', title: 'Cake Pops & Cupcakes', match: 'cupcake|cake pop' },
    { id: 'treats', title: 'Party Packs', match: '.' }
  ]
};

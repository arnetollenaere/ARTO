# Foto's

Alle foto's komen van Unsplash (https://unsplash.com/license): gratis voor commercieel gebruik, naamsvermelding niet verplicht. Het zijn sfeerbeelden; vervang ze door eigen foto's van De Zonnebloem en de echte wijnen zodra die er zijn.

| Bestand in `src/img/foto/` | Bron |
|---|---|
| held | https://unsplash.com/photos/c9k1Y4iXpeY |
| zonnebloemen | https://unsplash.com/photos/field-of-sunflowers-at-sunset-with-trees-in-background-s0lvwKX-p0I |
| samen | https://unsplash.com/photos/handicapped-and-couple-toss-each-other-of-glass-of-beer-PjODX5hruGQ |
| wijngaard | https://unsplash.com/photos/a-vineyard-with-a-sunset-7Bk2QKqwQRY |
| kelder | https://unsplash.com/photos/low-light-photography-of-pile-of-barrels-61sZcZl3Mlk |
| wit | https://unsplash.com/photos/sScNrKruEPs |
| chardonnay | https://unsplash.com/photos/SnErXaCiGa4 |
| rose | https://unsplash.com/photos/yDrI1Zw32fc |
| merlot | https://unsplash.com/photos/hK9hIPgF3QU |
| rioja | https://unsplash.com/photos/hvtZ0nP3ZEU |
| cava | https://unsplash.com/photos/0iiXnSq0u8g |

## Een foto vervangen

Wijnfoto's zijn 4:5 (staand), in twee breedtes: `<naam>-640.webp` en `<naam>-1000.webp`. Met ImageMagick:

```bash
convert origineel.jpg -gravity center -crop 4:5 +repage -resize 1000x -quality 72 src/img/foto/naam-1000.webp
convert origineel.jpg -gravity center -crop 4:5 +repage -resize 640x  -quality 72 src/img/foto/naam-640.webp
```

Zet daarna `"foto": "naam"` bij de wijn in `src/wijnen.json`.

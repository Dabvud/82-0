# Recherche: NBA-Jahresgehälter bis 1999/2000

Stand: 2. November 2026. Grundlage: `.superpowers/pre2000-liste.json`, **111 eindeutige IDs**.

Ergebnis: **92 Einträge mit Gehaltswert, davon 7 ausdrücklich unsicher; 19 null-Fälle.** Alle 111 Eingabe-IDs sind im JSON enthalten. Kein Saison-Endjahr liegt über 2000.

## Abgrenzung und Vorgehen

- `season` ist das **Endjahr**: 1998 = 1997/98, 2000 = 1999/2000. Verglichen wurden die verfügbaren Jahreszeilen bis einschließlich 1999/2000; Beträge ab 2000/01 wurden ausgeschlossen.
- Beträge sind nominale USD, ohne Inflationsbereinigung und ohne Werbe-/Sponsoringeinnahmen. Vertragssummen wurden nicht durch die Laufzeit geteilt. Bei Gleichstand wurde die frühere belegte Saison gewählt.
- Für 1998/99 stehen die nominalen Vertragsjahresbeträge vor der Lockout-Kürzung, entsprechend den historischen Gehaltstabellen. Sie sind keine Behauptung über den tatsächlich ausgezahlten Betrag der verkürzten Saison.
- Reihenfolge: Basketball-Reference, HoopsHype, Spielerartikel in Wikipedia, anschließend zeitgenössische Gehaltslisten/Presse. Direkte BBRef-Abrufe schlugen mehrfach mit HTTP 403 fehl; verwertbare Suchindex-Auszüge sind als BBRef belegt. HoopsHype-Spieler-Gehaltsseiten wurden durch Robots-/Zugriffssperren blockiert. Danach wurden die französischen Spielerartikel geprüft, bei historischen Grenzfällen zusätzlich russische Artikel und Presseberichte.
- Als offengelegter Ersatz für nicht direkt zugängliche Zeitungsarchive dient [Patricia Benders Gehaltsarchiv](https://www.eskimo.com/~pbender/). Die Listen 1992/93 bis 1997/98 nennen überwiegend Dallas Morning News, 1996/97 zusätzlich USA Today, 1999/2000 den Charlotte Observer vom 26.02.2000. [Basketball-Reference nennt Bender selbst als Datenquelle und erläutert historische Schätzungen](https://www.basketball-reference.com/about/salary.html). Die Liste 1998/99 enthält eigene Recherchen und markierte Schätzungen; relevante Spitzenwerte wurden zusätzlich gegengeprüft.
- Ein `unsicher:`-Hinweis bedeutet: Der Betrag steht konkret in der Quelle, aber das vollständige Karriere-Maximum oder die Abgrenzung der Saisonzahlung ist nicht gesichert. Solche Werte sind **keine bestätigten absoluten Maxima**. Bei fehlendem tragfähigem Jahreswert oder wesentlichen Widersprüchen steht `null`.
- Teams sind mit ihren damaligen englischen NBA-Namen vereinheitlicht. Bei Transfers bezeichnet das Feld das Team der Gehaltszeile; es ist keine vollständige Aufteilung der Zahlungen zwischen Arbeitgebern.

## Alle 111 Spieler

„—“ bedeutet `null`, nicht null Dollar. Bei diesen Zeilen verlinkt „Recherche“ einen geprüften Ausgangs-/Problembeleg, keinen Gehaltsnachweis.

| Name | ID | Saison (Endjahr) | Team | Gehalt (USD) | Quelle | Hinweis |
| --- | --- | --- | --- | ---: | --- | --- |
| Shaquille O'Neal | `shaquille-oneal` | 1999/00 (2000) | Los Angeles Lakers | 17.142.858 | [Wikipedia](https://fr.wikipedia.org/wiki/Shaquille_O'Neal#Salaires) | Lakers-Vertrag 1996: 7 Jahre/120 Mio. USD; hier die Jahresrate 1999/2000. |
| Steve Nash | `steve-nash` | 1999/00 (2000) | Dallas Mavericks | 5.500.000 | [Wikipedia](https://fr.wikipedia.org/wiki/Steve_Nash#Salaires) | — |
| Ray Allen | `ray-allen` | 1999/00 (2000) | Milwaukee Bucks | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Larry Bird | `larry-bird` | 1991/92 (1992) | Boston Celtics | 7.070.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%91%D1%91%D1%80%D0%B4%2C_%D0%9B%D0%B0%D1%80%D1%80%D0%B8) | — |
| Michael Jordan | `michael-jordan` | 1997/98 (1998) | Chicago Bulls | 33.140.000 | [BBRef](https://www.basketball-reference.com/players/j/jordami01.html#all_salaries) | — |
| Tracy McGrady | `tracy-mcgrady` | 1999/00 (2000) | Toronto Raptors | 1.767.120 | [Wikipedia](https://fr.wikipedia.org/wiki/Tracy_McGrady#Salaires) | — |
| Gary Payton | `gary-payton` | 1999/00 (2000) | Seattle SuperSonics | 11.020.473 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Hakeem Olajuwon | `hakeem-olajuwon` | 1999/00 (2000) | Houston Rockets | 14.302.001 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| David Robinson | `david-robinson` | 1998/99 (1999) | San Antonio Spurs | 14.841.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%A0%D0%BE%D0%B1%D0%B8%D0%BD%D1%81%D0%BE%D0%BD%2C_%D0%94%D1%8D%D0%B2%D0%B8%D0%B4) | Nominaler Jahresbetrag 1998/99 vor der Kürzung durch den Lockout. |
| Kevin Garnett | `kevin-garnett` | 1999/00 (2000) | Minnesota Timberwolves | 16.806.300 | [Wikipedia](https://fr.wikipedia.org/wiki/Kevin_Garnett#Salaires) | Sechsjahresverlängerung gilt ab 1998/99; 1999/2000 ist der höchste Jahreswert bis zum Stichtag. |
| Kobe Bryant | `kobe-bryant` | 1999/00 (2000) | Los Angeles Lakers | 9.000.000 | [Wikipedia](https://fr.wikipedia.org/wiki/Kobe_Bryant#Salaires) | — |
| John Stockton | `john-stockton` | 1999/00 (2000) | Utah Jazz | 11.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Vince Carter | `vince-carter` | 1999/00 (2000) | Toronto Raptors | 2.267.280 | [Wikipedia](https://fr.wikipedia.org/wiki/Vince_Carter#Salaires) | — |
| Dirk Nowitzki | `dirk-nowitzki` | 1999/00 (2000) | Dallas Mavericks | 1.583.040 | [Wikipedia](https://fr.wikipedia.org/wiki/Dirk_Nowitzki#Salaires) | — |
| Tim Duncan | `tim-duncan` | 1999/00 (2000) | San Antonio Spurs | 3.858.240 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Magic Johnson | `magic-johnson` | 1994/95 (1995) | Los Angeles Lakers | 14.660.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries95.txt) | 1994/95 trotz Rücktritt weiterbezahlt; in dieser Saison kein NBA-Einsatz. |
| Peja Stojaković | `peja-stojakovic` | 1999/00 (2000) | Sacramento Kings | 1.310.400 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Scottie Pippen | `scottie-pippen` | 1999/00 (2000) | Portland Trail Blazers | 14.795.642 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Paul Pierce | `paul-pierce` | 1999/00 (2000) | Boston Celtics | 1.503.960 | [Wikipedia](https://fr.wikipedia.org/wiki/Paul_Pierce#Salaires) | — |
| Tim Hardaway | `tim-hardaway` | 1998/99 (1999) | Miami Heat | 5.600.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%A5%D0%B0%D1%80%D0%B4%D1%83%D1%8D%D0%B9%2C_%D0%A2%D0%B8%D0%BC) | Nominaler Jahresbetrag 1998/99 vor der Kürzung durch den Lockout. |
| Jason Kidd | `jason-kidd` | 1999/00 (2000) | Phoenix Suns | 6.858.335 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Baron Davis | `baron-davis` | 1999/00 (2000) | Charlotte Hornets | 2.712.480 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Shawn Marion | `shawn-marion` | 1999/00 (2000) | Phoenix Suns | 1.546.320 | [Wikipedia](https://fr.wikipedia.org/wiki/Shawn_Marion#Salaires) | — |
| Mark Price | `mark-price` | 1997/98 (1998) | Orlando Magic | 4.090.920 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | — |
| Karl Malone | `karl-malone` | 1999/00 (2000) | Utah Jazz | 14.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Charles Barkley | `charles-barkley` | 1999/00 (2000) | Houston Rockets | 9.000.000 | [Wikipedia](https://fr.wikipedia.org/wiki/Charles_Barkley#Salaires) | — |
| Mitch Richmond | `mitch-richmond` | 1999/00 (2000) | Washington Wizards | 10.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Chris Webber | `chris-webber` | 1999/00 (2000) | Sacramento Kings | 11.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Kareem Abdul-Jabbar | `kareem-abdul-jabbar` | 1988/89 (1989) | Los Angeles Lakers | 3.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries89.txt) | — |
| Glen Rice | `glen-rice` | 1999/00 (2000) | Los Angeles Lakers | 7.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Chauncey Billups | `chauncey-billups` | 1999/00 (2000) | Orlando Magic | 3.100.080 | [Wikipedia](https://fr.wikipedia.org/wiki/Chauncey_Billups#Salaires) | 1999/2000 aus Denver nach Orlando getradet; Gehaltsquelle führt Orlando. |
| Patrick Ewing | `patrick-ewing` | 1997/98 (1998) | New York Knicks | 20.500.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | 1997/98 ist höher als 1995/96 (18.724.000 USD) und 1998/99 (18.500.000 USD). |
| Allen Iverson | `allen-iverson` | 1999/00 (2000) | Philadelphia 76ers | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Alonzo Mourning | `alonzo-mourning` | 1999/00 (2000) | Miami Heat | 15.004.800 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Mike Bibby | `mike-bibby` | 1999/00 (2000) | Vancouver Grizzlies | 3.092.400 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Jason Terry | `jason-terry` | 1999/00 (2000) | Atlanta Hawks | 1.468.920 | [Wikipedia](https://fr.wikipedia.org/wiki/Jason_Terry#Salaires) | — |
| Rashard Lewis | `rashard-lewis` | 1999/00 (2000) | Seattle SuperSonics | 385.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Reggie Miller | `reggie-miller` | 1996/97 (1997) | Indiana Pacers | 11.250.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%9C%D0%B8%D0%BB%D0%BB%D0%B5%D1%80%2C_%D0%A0%D0%B5%D0%B4%D0%B6%D0%B8) | — |
| Stephon Marbury | `stephon-marbury` | 1999/00 (2000) | New Jersey Nets | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Chris Mullin | `chris-mullin` | 1999/00 (2000) | Indiana Pacers | 4.079.100 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Penny Hardaway | `penny-hardaway` | 1999/00 (2000) | Phoenix Suns | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Clyde Drexler | `clyde-drexler` | 1995/96 (1996) | Houston Rockets | 9.810.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries96.txt) | — |
| Marcus Camby | `marcus-camby` | 1999/00 (2000) | New York Knicks | 5.250.000 | [Wikipedia](https://fr.wikipedia.org/wiki/Marcus_Camby#Salaires) | — |
| Isiah Thomas | `isiah-thomas` | 1991/92 (1992) | Detroit Pistons | 2.960.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%A2%D0%BE%D0%BC%D0%B0%D1%81%2C_%D0%90%D0%B9%D0%B7%D0%B5%D1%8F_(1961)) | — |
| Nick Van Exel | `nick-van-exel` | 1999/00 (2000) | Denver Nuggets | 8.354.614 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Kevin Johnson | `kevin-johnson` | 1997/98 (1998) | Phoenix Suns | 8.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | — |
| Rasheed Wallace | `rasheed-wallace` | 1999/00 (2000) | Portland Trail Blazers | 10.800.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Dominique Wilkins | `dominique-wilkins` | 1992/93 (1993) | Atlanta Hawks | 3.500.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%A3%D0%B8%D0%BB%D0%BA%D0%B8%D0%BD%D1%81%2C_%D0%94%D0%BE%D0%BC%D0%B8%D0%BD%D0%B8%D0%BA) | Gleich hoher Wert auch 1993/94; bei Gleichstand frühere Saison gewählt. Nur NBA, keine Europaverträge. |
| Grant Hill | `grant-hill` | 1999/00 (2000) | Detroit Pistons | 6.939.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Dikembe Mutombo | `dikembe-mutombo` | 1999/00 (2000) | Atlanta Hawks | 12.820.249 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Julius Erving | `julius-erving` | 1985/86 (1986) | Philadelphia 76ers | 1.485.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%98%D1%80%D0%B2%D0%B8%D0%BD%D0%B3%2C_%D0%94%D0%B6%D1%83%D0%BB%D0%B8%D1%83%D1%81) | unsicher: nur 1984/85 und 1985/86 tabellarisch belegt; höchster gefundener Wert, Karriere-Maximum nicht vollständig abgesichert. |
| Ben Wallace | `ben-wallace` | 1999/00 (2000) | Orlando Magic | 893.750 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Moses Malone | `moses-malone` | 1990/91 (1991) | Atlanta Hawks | 2.406.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%9C%D1%8D%D0%BB%D0%BE%D1%83%D0%BD%2C_%D0%9C%D0%BE%D0%B7%D0%B5%D1%81) | — |
| Alex English | `alex-english` | 1989/90 (1990) | Denver Nuggets | 2.100.000 | [BBRef](https://www.basketball-reference.com/players/e/englial01.html) | unsicher: höchster belegter Jahreswert; historische Gehaltsreihe ist nicht lückenlos. |
| Artis Gilmore | `artis-gilmore` | 1987/88 (1988) | Boston Celtics | 863.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%93%D0%B8%D0%BB%D0%BC%D0%BE%D1%80%2C_%D0%90%D1%80%D1%82%D0%B8%D1%81) | unsicher: lückenhafte Gehaltsreihe; größter belegter Wert. Saison auch bei Chicago, Gehaltsquelle führt Boston. |
| Antawn Jamison | `antawn-jamison` | 1999/00 (2000) | Golden State Warriors | 2.503.800 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Jalen Rose | `jalen-rose` | 1999/00 (2000) | Indiana Pacers | 2.437.500 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Jermaine O'Neal | `jermaine-oneal` | 1999/00 (2000) | Portland Trail Blazers | 5.075.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Detlef Schrempf | `detlef-schrempf` | 1994/95 (1995) | Seattle SuperSonics | 5.000.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%A8%D1%80%D0%B5%D0%BC%D0%BF%D1%84%2C_%D0%94%D0%B5%D1%82%D0%BB%D0%B5%D1%84) | Gleich hoher Wert auch 1995/96; bei Gleichstand frühere Saison gewählt. |
| Jerry Stackhouse | `jerry-stackhouse` | 1999/00 (2000) | Detroit Pistons | 4.781.250 | [Wikipedia](https://fr.wikipedia.org/wiki/Jerry_Stackhouse#Salaires) | — |
| Shawn Kemp | `shawn-kemp` | 1999/00 (2000) | Cleveland Cavaliers | 10.780.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Latrell Sprewell | `latrell-sprewell` | 1999/00 (2000) | New York Knicks | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Joe Dumars | `joe-dumars` | 1995/96 (1996) | Detroit Pistons | 6.881.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%94%D1%83%D0%BC%D0%B0%D1%80%D1%81%2C_%D0%94%D0%B6%D0%BE) | — |
| Vlade Divac | `vlade-divac` | 1999/00 (2000) | Sacramento Kings | 8.837.774 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Ricky Davis | `ricky-davis` | 1999/00 (2000) | Charlotte Hornets | 878.160 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| George Gervin | `george-gervin` | 1984/85 (1985) | San Antonio Spurs | 831.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%93%D0%B5%D1%80%D0%B2%D0%B8%D0%BD%2C_%D0%94%D0%B6%D0%BE%D1%80%D0%B4%D0%B6) | unsicher: Gehaltsreihe nur 1984/85 und 1985/86; größter belegter Wert, frühere Saisons nicht vollständig abgesichert. |
| Bill Walton | `bill-walton` | — | — | — | [Recherche](https://www.latimes.com/archives/la-xpm-1985-03-23-sp-21195-story.html) | Listenwert 1984/85 umfasst nicht gesicherte Anreize; tatsächliches höchstes Jahresgehalt nicht belastbar bestimmt. |
| Toni Kukoč | `toni-kukoc` | 1998/99 (1999) | Chicago Bulls | 4.610.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%9A%D1%83%D0%BA%D0%BE%D1%87%2C_%D0%A2%D0%BE%D0%BD%D0%B8) | Nominaler Jahresbetrag 1998/99 vor der Kürzung durch den Lockout. |
| Arvydas Sabonis | `arvydas-sabonis` | 1999/00 (2000) | Portland Trail Blazers | 9.818.481 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Richard Hamilton | `richard-hamilton` | 1999/00 (2000) | Washington Wizards | 1.836.240 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Dražen Petrović | `drazen-petrovic` | 1992/93 (1993) | New Jersey Nets | 1.615.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries93.txt) | — |
| Jim Jackson | `jim-jackson` | 1997/98 (1998) | Philadelphia 76ers | 4.600.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | 1997/98 auch bei den Golden State Warriors; Gehaltsliste führt Philadelphia. |
| Bob McAdoo | `bob-mcadoo` | — | — | — | [Recherche](https://www.basketball-reference.com/players/m/mcadobo01.html) | BBRef nennt 923.000 USD für 1984/85; Presseangaben weichen ab, weitere Saisons fehlen. Höchstwert nicht belastbar. |
| Elvin Hayes | `elvin-hayes` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Elvin_Hayes) | Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. |
| Dennis Rodman | `dennis-rodman` | 1996/97 (1997) | Chicago Bulls | 9.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries97.txt) | — |
| Bernard King | `bernard-king` | 1991/92 (1992) | Washington Bullets | 2.525.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries92.txt) | — |
| Rik Smits | `rik-smits` | 1999/00 (2000) | Indiana Pacers | 12.250.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Oscar Robertson | `oscar-robertson` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Oscar_Robertson) | Einzelne Vertragsangaben erlauben keinen belastbaren Vergleich aller NBA-Saisons. |
| Rick Barry | `rick-barry` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Rick_Barry) | Gefundene konkrete Vertragsangaben betreffen insbesondere die ABA; kein belastbares NBA-Jahresmaximum. |
| Walt Frazier | `walt-frazier` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Walt_Frazier) | Keine ausreichend belegte saisonbezogene Gehaltsreihe bzw. gesichertes Maximum gefunden. |
| Wes Unseld | `wes-unseld` | — | — | — | [Recherche](https://www.upi.com/Archives/1981/03/19/Reluctantly-Wes-Unseld-announced-his-retirement-WednesdayIt-wasnt-exactly/2794353826000/) | Vertrags-/Karriereberichte ohne belastbaren saisonübergreifenden Gehaltsvergleich. |
| David Thompson | `david-thompson` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/David_Thompson_(basketball)) | Mehrjahresvertrag bekannt, aber keine belastbare Jahresaufteilung und kein gesichertes NBA-Maximum. |
| John Havlicek | `john-havlicek` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/John_Havlicek) | Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. |
| Jerry West | `jerry-west` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Jerry_West) | Einzelangaben ohne belastbaren saisonübergreifenden Gehaltsvergleich. |
| Pete Maravich | `pete-maravich` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Pete_Maravich) | Mehrjahresvertrag von Atlanta belegt; Jahresaufteilung und spätere Höchstzahlung nicht gesichert. |
| Bob Cousy | `bob-cousy` | — | — | — | [Recherche](https://www.nba.com/news/qa-boston-celtics-legend-bob-cousy) | 35.000 USD 1963 selbst bestätigt; kein gesicherter Gesamtvergleich einschließlich Comeback als Spielertrainer 1969/70. |
| Wilt Chamberlain | `wilt-chamberlain` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Wilt_Chamberlain) | Einzelne NBA-Verträge bekannt; spätere NBA-Jahresraten nicht vollständig belegt. ABA-Spielertrainervertrag ausgeschlossen. |
| Bill Russell | `bill-russell` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Bill_Russell) | 100.001 USD ab 1965 bekannt; spätere Vergütung als Spielertrainer und saisonbezogenes Maximum nicht gesichert. |
| Elgin Baylor | `elgin-baylor` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Elgin_Baylor) | Keine belastbare Jahresgehaltsreihe bis zum Karriereende gefunden. |
| George Mikan | `george-mikan` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/George_Mikan) | Widersprüchliche historische Beträge und unklare Saisonzuordnung; kein belastbares Maximum. |
| Bob Pettit | `bob-pettit` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Bob_Pettit) | Rookie-Vertrag bekannt; späterer saisonbezogener Höchstwert nicht ausreichend belegt. |
| Willis Reed | `willis-reed` | — | — | — | [Recherche](https://en.wikipedia.org/wiki/Willis_Reed) | Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. |
| Robert Horry | `robert-horry` | 1997/98 (1998) | Los Angeles Lakers | 6.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | — |
| Bruce Bowen | `bruce-bowen` | 1999/00 (2000) | Chicago Bulls | 510.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%91%D0%BE%D1%83%D1%8D%D0%BD%2C_%D0%91%D1%80%D1%8E%D1%81) | unsicher: Quelle weist 510.000 USD bei Chicago aus; nach Freistellung weiterer Vertrag bei Miami, dessen zusätzliche Zahlung nicht beziffert ist. |
| Rick Fox | `rick-fox` | 1999/00 (2000) | Los Angeles Lakers | 3.033.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Brian Shaw | `brian-shaw` | 1995/96 (1996) | Orlando Magic | 4.250.000 | [BBRef](https://www.basketball-reference.com/tools/share.fcgi?id=RMJRP) | — |
| Luc Longley | `luc-longley` | 1999/00 (2000) | Phoenix Suns | 5.175.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Bill Cartwright | `bill-cartwright` | 1993/94 (1994) | Chicago Bulls | 2.400.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries94.txt) | — |
| John Paxson | `john-paxson` | 1991/92 (1992) | Chicago Bulls | 1.600.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries92.txt) | — |
| Steve Kerr | `steve-kerr` | 1999/00 (2000) | San Antonio Spurs | 1.968.750 | [Wikipedia](https://fr.wikipedia.org/wiki/Steve_Kerr#Salaires) | — |
| Kurt Rambis | `kurt-rambis` | 1992/93 (1993) | Phoenix Suns | 1.100.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries93.txt) | — |
| Dennis Johnson | `dennis-johnson` | 1988/89 (1989) | Boston Celtics | 835.500 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%94%D0%B6%D0%BE%D0%BD%D1%81%D0%BE%D0%BD%2C_%D0%94%D0%B5%D0%BD%D0%BD%D0%B8%D1%81) | unsicher: größter belegter Wert; insbesondere 1989/90 und weitere frühere Saisons ohne genaue Gehaltsangabe. |
| Michael Cooper | `michael-cooper` | 1987/88 (1988) | Los Angeles Lakers | 676.500 | [BBRef](https://www.basketball-reference.com/players/c/coopemi01.html) | unsicher: größter belegter Wert; Gehaltsreihe lückenhaft, insbesondere 1988/89 und 1989/90. |
| A.C. Green | `ac-green` | — | — | — | [Recherche](https://www.eskimo.com/~pbender/misc/salaries96.txt) | 6.473.000 USD ausdrücklich als average bezeichnet; Cap-/Durchschnittswert nicht als tatsächliches Jahresgehalt übernommen. |
| Horace Grant | `horace-grant` | 1996/97 (1997) | Orlando Magic | 14.857.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%93%D1%80%D0%B0%D0%BD%D1%82%2C_%D0%A5%D0%BE%D1%80%D0%B0%D1%81) | — |
| Mario Elie | `mario-elie` | 1997/98 (1998) | Houston Rockets | 2.430.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries98.txt) | — |
| Sam Cassell | `sam-cassell` | 1999/00 (2000) | Milwaukee Bucks | 3.500.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |
| Kenny Smith | `kenny-smith` | 1995/96 (1996) | Houston Rockets | 2.683.000 | [BBRef](https://www.basketball-reference.com/players/s/smithke01.html) | — |
| Vernon Maxwell | `vernon-maxwell` | 1994/95 (1995) | Houston Rockets | 1.833.000 | [Wikipedia](https://ru.wikipedia.org/wiki/%D0%9C%D0%B0%D0%BA%D1%81%D0%B2%D0%B5%D0%BB%D0%BB%2C_%D0%92%D0%B5%D1%80%D0%BD%D0%BE%D0%BD) | — |
| Otis Thorpe | `otis-thorpe` | 1996/97 (1997) | Detroit Pistons | 7.000.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries97.txt) | — |
| Antonio McDyess | `antonio-mcdyess` | 1999/00 (2000) | Denver Nuggets | 9.900.000 | [Presse via Bender](https://www.eskimo.com/~pbender/misc/salaries00.txt) | — |

## null-Fälle (19)

- **Bill Walton** (`bill-walton`): Listenwert 1984/85 umfasst nicht gesicherte Anreize; tatsächliches höchstes Jahresgehalt nicht belastbar bestimmt. [Beleg/Rechercheansatz](https://www.latimes.com/archives/la-xpm-1985-03-23-sp-21195-story.html).
- **Bob McAdoo** (`bob-mcadoo`): BBRef nennt 923.000 USD für 1984/85; Presseangaben weichen ab, weitere Saisons fehlen. Höchstwert nicht belastbar. [Beleg/Rechercheansatz](https://www.basketball-reference.com/players/m/mcadobo01.html).
- **Elvin Hayes** (`elvin-hayes`): Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Elvin_Hayes).
- **Oscar Robertson** (`oscar-robertson`): Einzelne Vertragsangaben erlauben keinen belastbaren Vergleich aller NBA-Saisons. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Oscar_Robertson).
- **Rick Barry** (`rick-barry`): Gefundene konkrete Vertragsangaben betreffen insbesondere die ABA; kein belastbares NBA-Jahresmaximum. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Rick_Barry).
- **Walt Frazier** (`walt-frazier`): Keine ausreichend belegte saisonbezogene Gehaltsreihe bzw. gesichertes Maximum gefunden. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Walt_Frazier).
- **Wes Unseld** (`wes-unseld`): Vertrags-/Karriereberichte ohne belastbaren saisonübergreifenden Gehaltsvergleich. [Beleg/Rechercheansatz](https://www.upi.com/Archives/1981/03/19/Reluctantly-Wes-Unseld-announced-his-retirement-WednesdayIt-wasnt-exactly/2794353826000/).
- **David Thompson** (`david-thompson`): Mehrjahresvertrag bekannt, aber keine belastbare Jahresaufteilung und kein gesichertes NBA-Maximum. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/David_Thompson_(basketball)).
- **John Havlicek** (`john-havlicek`): Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/John_Havlicek).
- **Jerry West** (`jerry-west`): Einzelangaben ohne belastbaren saisonübergreifenden Gehaltsvergleich. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Jerry_West).
- **Pete Maravich** (`pete-maravich`): Mehrjahresvertrag von Atlanta belegt; Jahresaufteilung und spätere Höchstzahlung nicht gesichert. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Pete_Maravich).
- **Bob Cousy** (`bob-cousy`): 35.000 USD 1963 selbst bestätigt; kein gesicherter Gesamtvergleich einschließlich Comeback als Spielertrainer 1969/70. [Beleg/Rechercheansatz](https://www.nba.com/news/qa-boston-celtics-legend-bob-cousy).
- **Wilt Chamberlain** (`wilt-chamberlain`): Einzelne NBA-Verträge bekannt; spätere NBA-Jahresraten nicht vollständig belegt. ABA-Spielertrainervertrag ausgeschlossen. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Wilt_Chamberlain).
- **Bill Russell** (`bill-russell`): 100.001 USD ab 1965 bekannt; spätere Vergütung als Spielertrainer und saisonbezogenes Maximum nicht gesichert. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Bill_Russell).
- **Elgin Baylor** (`elgin-baylor`): Keine belastbare Jahresgehaltsreihe bis zum Karriereende gefunden. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Elgin_Baylor).
- **George Mikan** (`george-mikan`): Widersprüchliche historische Beträge und unklare Saisonzuordnung; kein belastbares Maximum. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/George_Mikan).
- **Bob Pettit** (`bob-pettit`): Rookie-Vertrag bekannt; späterer saisonbezogener Höchstwert nicht ausreichend belegt. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Bob_Pettit).
- **Willis Reed** (`willis-reed`): Keine belastbare saisonbezogene Gehaltsreihe bzw. belegtes Maximum gefunden. [Beleg/Rechercheansatz](https://en.wikipedia.org/wiki/Willis_Reed).
- **A.C. Green** (`ac-green`): 6.473.000 USD ausdrücklich als average bezeichnet; Cap-/Durchschnittswert nicht als tatsächliches Jahresgehalt übernommen. [Beleg/Rechercheansatz](https://www.eskimo.com/~pbender/misc/salaries96.txt).

## Unsichere Fälle (7)

- **Julius Erving**: 1985/86, 1.485.000 USD. unsicher: nur 1984/85 und 1985/86 tabellarisch belegt; höchster gefundener Wert, Karriere-Maximum nicht vollständig abgesichert. [Quelle](https://ru.wikipedia.org/wiki/%D0%98%D1%80%D0%B2%D0%B8%D0%BD%D0%B3%2C_%D0%94%D0%B6%D1%83%D0%BB%D0%B8%D1%83%D1%81).
- **Alex English**: 1989/90, 2.100.000 USD. unsicher: höchster belegter Jahreswert; historische Gehaltsreihe ist nicht lückenlos. [Quelle](https://www.basketball-reference.com/players/e/englial01.html).
- **Artis Gilmore**: 1987/88, 863.000 USD. unsicher: lückenhafte Gehaltsreihe; größter belegter Wert. Saison auch bei Chicago, Gehaltsquelle führt Boston. [Quelle](https://ru.wikipedia.org/wiki/%D0%93%D0%B8%D0%BB%D0%BC%D0%BE%D1%80%2C_%D0%90%D1%80%D1%82%D0%B8%D1%81).
- **George Gervin**: 1984/85, 831.000 USD. unsicher: Gehaltsreihe nur 1984/85 und 1985/86; größter belegter Wert, frühere Saisons nicht vollständig abgesichert. [Quelle](https://ru.wikipedia.org/wiki/%D0%93%D0%B5%D1%80%D0%B2%D0%B8%D0%BD%2C_%D0%94%D0%B6%D0%BE%D1%80%D0%B4%D0%B6).
- **Bruce Bowen**: 1999/00, 510.000 USD. unsicher: Quelle weist 510.000 USD bei Chicago aus; nach Freistellung weiterer Vertrag bei Miami, dessen zusätzliche Zahlung nicht beziffert ist. [Quelle](https://ru.wikipedia.org/wiki/%D0%91%D0%BE%D1%83%D1%8D%D0%BD%2C_%D0%91%D1%80%D1%8E%D1%81).
- **Dennis Johnson**: 1988/89, 835.500 USD. unsicher: größter belegter Wert; insbesondere 1989/90 und weitere frühere Saisons ohne genaue Gehaltsangabe. [Quelle](https://ru.wikipedia.org/wiki/%D0%94%D0%B6%D0%BE%D0%BD%D1%81%D0%BE%D0%BD%2C_%D0%94%D0%B5%D0%BD%D0%BD%D0%B8%D1%81).
- **Michael Cooper**: 1987/88, 676.500 USD. unsicher: größter belegter Wert; Gehaltsreihe lückenhaft, insbesondere 1988/89 und 1989/90. [Quelle](https://www.basketball-reference.com/players/c/coopemi01.html).

## Spezialfälle und verworfene Werte

- **Michael Jordan:** 33.140.000 USD für 1997/98 (Endjahr 1998); höher als 30.140.000 USD für 1996/97. [BBRef-Gehaltsauszug](https://www.basketball-reference.com/tools/share.fcgi?id=31v9z).
- **Kevin Garnett:** Die sechsjährige Verlängerung beginnt 1998/99 mit 14.000.000 USD; bis zum Stichtag liegt das Maximum bei 16.806.300 USD für 1999/2000. Spätere Vertragsjahre bleiben ausgeschlossen. [Spielerartikel mit Jahresraten](https://fr.wikipedia.org/wiki/Kevin_Garnett#Salaires).
- **Patrick Ewing:** 20.500.000 USD für 1997/98; weder die auffälligen 18.724.000 USD für 1995/96 noch 18.500.000 USD für 1998/99 sind hier sein Maximum. [Gehaltsreihe](https://ru.wikipedia.org/wiki/%D0%AE%D0%B8%D0%BD%D0%B3%2C_%D0%9F%D0%B0%D1%82%D1%80%D0%B8%D0%BA).
- **Shaquille O’Neal:** Der Lakers-Vertrag von 1996 liefert 17.142.858 USD für 1999/2000. 120 Mio. USD sind die Summe über sieben Jahre. [Jahresraten im Spielerartikel](https://fr.wikipedia.org/wiki/Shaquille_O%27Neal#Salaires).
- **Alonzo Mourning:** 15.004.800 USD für 1999/2000; keine Verwechslung mit dem Gesamtwert des 1996 abgeschlossenen Mehrjahresvertrags. [Gehaltsliste 1999/2000](https://www.eskimo.com/~pbender/misc/salaries00.txt).
- **David Robinson / Tim Hardaway / Toni Kukoč:** Der größte nominale Jahresbetrag liegt schon 1998/99. Die Lockout-Zahlungen sind davon zu unterscheiden. [Quelle mit Jahresbeträgen und gekürzten Beträgen in Klammern](https://www.eskimo.com/~pbender/misc/salaries99.txt).
- **Juwan Howard:** In den 111 Eingabe-IDs **nicht enthalten**, deshalb kein zusätzlicher JSON-Schlüssel. Der 1996 endgültig abgeschlossene Vertrag war ein Washington-Vertrag; der Miami-Vertrag wurde nicht wirksam. 1999/2000 sind 15.000.000 USD bei den Washington Wizards belegt. [Vertragsgeschichte](https://en.wikipedia.org/wiki/Juwan_Howard), [Jahresrate](https://www.eskimo.com/~pbender/misc/salaries00.txt).
- **Magic Johnson:** Die 14.660.000 USD 1994/95 sind eine Zahlung während seines Rücktritts; kein Einsatz in dieser Saison. [Zeitgenössischer Zahlungsbeleg](https://www.latimes.com/archives/la-xpm-1995-01-09-sp-17922-story.html).
- **A.C. Green:** 6.473.000 USD 1995/96 sind als Durchschnitts-/Cap-Wert gekennzeichnet; deshalb kein belastbares Jahresmaximum im JSON. [Originalhinweis „average“](https://www.eskimo.com/~pbender/misc/salaries96.txt).
- **Bill Walton:** Ein verbreiteter Listenwert ist angesichts abweichender Vertrags- und Anreizangaben nicht als sicheres Jahresmaximum brauchbar. [Zeitgenössischer Vertragsbericht](https://www.latimes.com/archives/la-xpm-1985-03-23-sp-21195-story.html). Der JSON-Wert bleibt `null`.
- **Bob McAdoo:** Der BBRef-Wert 923.000 USD 1984/85 steht einer abweichenden damaligen Pressemeldung gegenüber; weitere Gehaltsjahre fehlen. [BBRef](https://www.basketball-reference.com/players/m/mcadobo01.html), [abweichende Meldung](https://ecms.newportbeachca.gov/Web/0/edoc/1295519/1985-07-12%20-%20Orange%20Coast%20Pilot.pdf). Deshalb `null`.
- **Historische Verträge vor 1985:** Einzelne Rookie-Gehälter, Mehrjahressummen und kombinierte Spielertrainervergütungen ersetzen kein belegtes höchstes NBA-Saisongehalt. Solche Angaben wurden nicht in Jahreswerte umgerechnet.

## Prüfung

- JSON syntaktisch gültig; exakt 111 Schlüssel, identisch zur Eingabeliste, keine zusätzlichen IDs.
- Jeder Zahlenwert ist ein positiver ganzzahliger USD-Betrag mit Team, konkreter Quellen-URL und Saison-Endjahr innerhalb des Eingabe-Karrierefensters sowie ≤ 2000.
- Jeder unsichere Eintrag beginnt im optionalen JSON-Feld `note` mit `unsicher:`; sämtliche null-Fälle und unsicheren Fälle sind oben separat aufgeführt.
- Geschrieben werden ausschließlich `data/manual/contracts-pre2000.json` und `.superpowers/contracts-pre2000-bericht.md`; kein Commit.

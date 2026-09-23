---
name: turkish-grammar
description: Rules for Turkish vowel harmony and phonetic accusative suffix generation in activity feeds and notifications.
---

# Turkish Grammar & Phonetic Accusative Suffix Rules

## 1. Why Phonetic Suffixes Matter
In social feeds and activity cards, displaying literal hardcoded strings like `Severance i izledi` or `Loki i izledi` looks unnatural. The Turkish language requires vowel harmony and buffer consonants (kaynaştırma harfleri) based on phonetic pronunciation.

## 2. Using `textUtils.ts`
Always import and use the helper functions from `src/utils/textUtils.ts`:

```typescript
import { getTurkishAccusativeSuffix, getEpisodeAccusativeSuffix } from '../utils/textUtils';

// Examples for media titles:
const titleSuffix = getTurkishAccusativeSuffix(mediaTitle);
// "Loki"      -> "'yi"  => "Loki'yi izledi"
// "Severance" -> "'ı"   => "Severance'ı izledi" (pronounced /sevrıns/)
// "Matrix"    -> "'i"   => "Matrix'i izledi"
// "Fargo"     -> "'yu"  => "Fargo'yu izledi"

// Examples for episode numbers:
const epSuffix = getEpisodeAccusativeSuffix(episodeNumber);
// 1 -> "'i"   => "S1B1'i izledi"
// 2 -> "'yi"  => "S1B2'yi izledi"
// 3 -> "'ü"   => "S1B3'ü izledi"
// 6 -> "'yı"  => "S1B6'yı izledi"
```

## 3. General String Formatting
* Month names: Format with Turkish locale: `toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })`.
* Numbers: Format with Turkish locale where applicable: `number.toLocaleString('tr-TR')`.

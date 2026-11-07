# Naruto Life — Beta 0.1

Simulador de vida ninja no estilo BitLife, feito para celular. O jogo é HTML5 offline (pasta `www/`) empacotado como app Android com Capacitor.

## O que já funciona (Beta 0.1)

- Menu com **Vida aleatória**, **Configurar vida** e **Continuar** (salva automaticamente).
- Criação: nome, sobrenome, sexo, vila/país, clã ou família comum, pais e irmãos, condição financeira, elementos de chakra e Kekkei Genkai.
- Idade ano a ano (nasce com a geração do Naruto), com envelhecimento e morte.
- 6 atributos: Saúde, Inteligência, Força, Velocidade, Resistência, Disciplina.
- Família, amigos e equipe ninja com relacionamento e interações.
- Escola comum ou Academia Ninja, notas, chakra, Exame de Graduação, Genin → Chunin → Jounin, missões D/C/B/A.
- Vida civil: 7 empregos, salários, demissão, aumentos.
- Eventos anuais com decisões (mais de 25).
- Abas estilo BitLife: Ocupação, Ficha, Relações, Atividades e o botão central IDADE.

## Testar no navegador

```
npm run serve     # abre em http://localhost:8080
```

(ou simplesmente abra `www/index.html`).

## Gerar o APK

### Opção A — sem instalar nada (GitHub Actions)

1. Crie um repositório no GitHub e envie esta pasta inteira.
2. Aba **Actions** → **Gerar APK e AAB** → **Run workflow**.
3. Ao terminar, baixe o artefato `naruto-life-apk` (arquivo `app-debug.apk`) e instale no celular.

### Opção B — no seu computador

Requisitos: Node 22+, JDK 21 e Android Studio.

```
npm install
npx cap add android
npm run android:assets     # gera ícones e splash a partir de assets/
npx cap sync android
npm run android:apk        # APK em android/app/build/outputs/apk/debug/
```

Ou `npm run android:open` e use **Build > Build APK(s)** no Android Studio.


### Opção C — converter online, sem GitHub Actions (PWA)

O jogo agora é um PWA (tem `manifest.json` e `sw.js`). Se você hospedar a pasta `www/` em um endereço https (GitHub Pages, Netlify ou Cloudflare Pages, todos gratuitos), dá para:

- **Instalar direto:** abrir o endereço no Chrome do celular e tocar em *Adicionar à tela inicial* (funciona offline depois do primeiro acesso).
- **Gerar APK/AAB:** colar o endereço em pwabuilder.com, escolher *Android* e baixar o pacote.

## Publicar na Play Store

A Play Store exige **AAB** (não APK) assinado:

1. Crie uma conta no Google Play Console (taxa única).
2. Gere uma chave de assinatura:
   `keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias naruto`
   **Guarde esse arquivo e as senhas em local seguro.**
3. No GitHub: Settings → Secrets → Actions, cadastre `KEYSTORE_BASE64` (conteúdo de `release.jks` em base64), `KEYSTORE_PASSWORD`, `KEY_PASSWORD` e `KEY_ALIAS`. O workflow passa a gerar também o `naruto-life-aab`.
4. A cada nova versão, aumente `versionCode` e `versionName` em `android/app/build.gradle`.
5. Preencha ficha da loja, classificação etária, política de privacidade e capturas de tela.
6. Confira o `targetSdk` exigido pela Google na data da publicação.

### Atenção com direitos autorais

Naruto, nomes de personagens, vilas e símbolos pertencem aos detentores dos direitos. Publicar um jogo com esses nomes na Play Store costuma gerar recusa ou remoção por violação de propriedade intelectual. Antes de publicar, troque o título e os nomes de vilas, clãs e técnicas por nomes originais (isso fica concentrado em `www/js/data.js`) e use o ícone original da pasta `assets/`.

## Estrutura

```
www/index.html          página única
www/css/style.css       visual
www/js/data.js          vilas, clãs, empregos, missões, nomes
www/js/engine.js        regras: vida, idade, eventos, carreira
www/js/ui.js            telas e abas
assets/                 ícone e splash
capacitor.config.json   configuração do app (appId com.vidaninja.narutolife)
.github/workflows/      build automático do APK/AAB
```

## Próximas versões (roadmap)

0.2 clãs e genética · 0.3 academia e progressão ninja · 0.4 empregos e empresas · 0.5 combates e técnicas · 0.6 missões e organizações · 0.7 política e guerras · 0.8 NPCs com vidas próprias.

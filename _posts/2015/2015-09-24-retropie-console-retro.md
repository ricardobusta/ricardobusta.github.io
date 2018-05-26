---
layout: post
title: Retropie - Transformando a Raspberry em um console retrô
time: '20:07'
tags: [DIY, Games, Hacker]
---

Esse final de semana dediquei algum tempo a reviver minha Raspberry Pi 2. Alguns arquivos tinham sido corrompidos por um desligamento forçado que foi causado por sobrecarga de 4 controles plugados simultaneamente.

Enquanto repetia o processo mais uma vez, pensei que poderia fazer um tutorial passo a passo, tanto para se alguém quiser ter uma raspi para ser usada como console retrô, como para mim mesmo em um futuro não tão distante.

---

# Material:

## 1 - Raspberry Pi 2

Se for usar outro modelo, talvez tenha que adaptar algumas coisas. Adquiri a minha no [Site da Farnell](<http://www.farnellnewark.com.br/placaraspberrypi2modelb1gb,product,RASP001,0.aspx>) em abril, junto com outros seis amigos, e saiu exatamente *R$ 261,43* para cada um, incluindo o frete. Não sei como está o preço agora.

![Nossa encomenda quando chegou]({{ site.img }}/2015/retropie_unbox.jpg)

_Nossa encomenda quando chegou._

<!--more-->

Eu particularmente achei interessante colocar uma _case_ com um _cooler_ na minha Raspberry, já que jogatinas intensas costumam aquecer ela um pouquinho. Mas existem diversos modelos de cases, com e sem dissipadores, e também é possível construir a sua própria (eu havia feito uma de lego anteriormente).

![Raspberry com case de acrílico e cooler.]({{ site.img }}/2015/retropie_case.jpg)

_Raspberry com case de acrílico e cooler._

## 2 - Fonte

Cada modelo de Raspberry possui requerimentos diferentes:

|Product |Recommended PSU current capacity|Maximum total USB peripheral current draw|Typical bare-board active current consumption|
| --- | --- | --- | --- |
|Raspberry Pi Model A|700mA|500mA|200mA|
|Raspberry Pi Model B|1.2A|500mA|500mA|
|Raspberry Pi Model A+|700mA|500mA|180mA|
|Raspberry Pi Model B+|1.8A|600mA/1.2A (switchable)|330mA|
|Raspberry Pi 2 Model B|1.8A|600mA/1.2A (switchable)||

Para a minha, estou utilizando um carregador de celular da Samsung (Galaxy S3). Entretanto, o cabo que veio com o carregador fazia com que a Raspberry desse um warning de power surge (Um quadrado colorido no canto da tela). Trocando o cabo por outro, o warning desapareceu. É possível utilizar a Raspberry mesmo com o warning, porém a vida útil dela pode ser drasticamente reduzida por conta disso.


## 3 - Cartão Micro SD

Eu diria para utilizar pelo menos um cartão de 4gb. O meu é 16gb classe 10. É bom deixar espaço para colocar muitos jogos, principalmente os de psx que são relativamente grandes. Além disso, eu gosto de instalar uma interface gráfica para usar a minha Raspberry como desktop.

EDIT: Pessoas perguntaram sobre o armazenamento máximo. No [site raspberrypi.org](https://www.raspberrypi.org/help/faqs/#sdMax) eles citam terem testado SDs de até 32GB, e usaram um dispositivo de armazenamento USB externo para expandir a capacidade.

EDIT2: Sobre o cartão ser classe 4 ou classe 10, [outra parte do site raspberry.org](https://www.raspberrypi.org/documentation/installation/sd-cards.md) diz que existe um tradeoff de velocidade de escrita e leitura dependendo da classe. No caso do classe 4, o tempo de escrita será 4MB/s, enquanto no classe 10 é de 10MB/s. Porém o classe 10 não garante que a performance será melhor, pois ele pode sacrificar tempo de leitura e busca para ganhar o desempenho de escrita.

## 4 - Teclado USB

Se tiver como acessar a raspberry via SSH, pode ser desnecessário. Mas na dúvida, é sempre bom ter um.

## 5 - Cabo Ethernet

Alternativamente, você pode usar um adaptador wireless. Mas é infinitamente mais fácil fazer a rede cabeada.

## 6 - Controle USB

Fica a seu critério. Existem vários controles USB compatíveis com a Raspberry. Meu favorito é o do xbox 360 com fio, pois além de não necessitar nenhuma configuração adicional, é um controle de qualidade e bem indestrutível.

# Passo 1:

## Sistema Operacional

No lugar de configurar tudo, desde o bootloader, até instalar o SO em si, a distribuição retropie fornece uma imagem pré-configurada, que já vem com tudo isso e mais coisas, como os próprios emuladores.

![Tela de seleção de emuladores.]({{ site.img }}/2015/retropie_so.jpg)
_Tela de seleção de emuladores._

Na [página do projeto](http://blog.petrockblock.com/retropie/) é possível encontrar o [link para download](http://blog.petrockblock.com/retropie/retropie-downloads/) das imagens. A que eu utilizei para o meu setup foi _"RetroPie SD-card Image for Raspberry Pi 2 Version 3.0"._ Agora é preciso copiar essa imagem para o cartão SD.

**Se você está no Linux**, pode usar o comando "dd" da seguinte forma:

```sh
dd bs=4M if=path/to/image/retropie-image.img of=/dev/sdb
```

Sendo /dev/sdb o dispositivo que corresponde ao Cartão SD inserido.

**No Windows**, basta utilizar o [Win32DiskImager](http://sourceforge.net/projects/win32diskimager/), e seguir as instruções na própria aplicação.

E pronto! Só colocar seu SD na Raspberry, e ligar, que o sistema irá bootar.

# Passo 2:

## Configurações

Antes de tudo, é preciso saber que o usuário e senha padrão da imagem do retropie são **pi** e **raspberry** respectivamente.

Após o primeiro boot, é interessante fazer algumas configurações. O EmulationStation deve ter sido lançado automaticamente após a inicialização do sistema. Nesse momento, você deve acessar a placa via SSH, ou plugar um teclado USB e pressionar F4 (e depois qualquer tecla) para entrar no modo console.

![Olá, retropie.]({{ site.img }}/2015/retropie_console.png)

_Olá, retropie._

Feito isso, é preciso executar o seguinte comando:

```sh
sudo raspi-config
```

![Configuration Tool]({{ site.img }}/2015/retropie_config.png)

_Configuration Tool_

Nessa tela, execute a primeira opção: Expand Filesystem. Isso basicamente vai fazer o sistema de arquivos ocupar todo o seu SD. Esse passo é necessário, uma vez que você copiou uma imagem de tamanho fixo para dentro de um SD provavelmente maior.

Depois de terminar, você pode configurar mais coisas, como trocar a senha do usuário e fazer overclock. Só faça isso se souber o que está fazendo. Para a minha Raspberry, não fiz nenhuma configuração adicional. Após a configuração, selecione \<Finish\> e em seguida reinicie o aparelho.
# Outras Configurações (Opcional)

**Para jogar com o controle de Xbox** em qualquer emulador, tive que modificar um arquivo de configuração para que comandos de input feitos no analógico esquerdo do controle fossem interpretados pelos emuladores como entradas do d-pad. Para isso, editei o arquivo localizado em:

```sh
/opt/retropie/configs/all/retroarch.cfg
```

Qualquer opção modificada nesse arquivo irá dar override em todas as outras opções dos demais arquivos de configuração dos emuladores.

Então eu adicionei as seguintes linhas logo abaixo do marcador "**### Input**"

```ini
#### Input

# customized to make all emulators use analog as dpad
input_player1_analog_dpad_mode = "1"
input_player2_analog_dpad_mode = "1"
input_player3_analog_dpad_mode = "1"
input_player4_analog_dpad_mode = "1"
```

Para configurar uma interface gráfica, é preciso fazer algumas configurações também. Por default, a única interface que vem na retropie é do EmulationStation. Minha escolha de interface foi a [LXDE](http://lxde.org/). Para instalar, basta executar o seguinte comando:

```sh
sudo apt-get install lxde
```

É preciso estar conectado à internet para que o sistema possa baixar os pacotes necessários e instalar. Após a instalação terminar, é interessante dar um reboot na máquina:

```sh
sudo reboot
```

Feito isso, para iniciar a interface gráfica basta dar um:

```sh
startx
```

Para acessar a interface gráfica a partir do próprio EmulationStation, é preciso criar uma entrada em:

```sh
/home/pi/.emulationstation/gamelists/retropie/gamelist.xml
```

E a entrada é:

```xml
<game>
    <path>./desktop.sh</path>
    <name>LXDE Desktop</name>
</game>
```

Isso quer dizer que terá um "_Desktop_" no menu que irá executar um script "_desktop.h_". Então, criamos o arquivo "_dekstop.h_" em:

```sh
/home/pi/RetroPie/retropiemenu/dekstop.sh
```

E como seu conteúdo, colocamos:

```sh
#!/bin/bash
startx
```

Pronto! O resultado deve ser algo do tipo:

![Script para acessar o desktop]({{ site.img }}/2015/retropie_shortcut.jpg)

_Script para acessar o desktop._

E ao entrar no desktop...

![Sua nova área de trabalho]({{ site.img }}/2015/retropie_desktop.jpg)

# Passo 3:

## Jogos!

O passo mais importante, e também o mais fácil. Existem duas partes importantes para modificar:

```sh
/home/pi/RetroPie/roms
```

e

```sh
/home/pi/RetroPie/BIOS
```

É importante que na **pasta BIOS** esteja o arquivo da BIOS do emulador que você deseja jogar. Alguns emuladores não precisam, mas outros, como psx e gba, não funcionam corretamente sem. Esses arquivos podem ser encontrados em diversos lugares, e existe [uma página](https://github.com/RetroPie/RetroPie-Setup/wiki/BIOS-setup-for-RetroPie) dizendo qual arquivo deve ser colocado para qual emulador. Portanto, basta clicar no link acima e encontrar os arquivos.

Dentro da **pasta roms**, existe uma pasta diferente para cada emulador. Para colocar os jogos, é necessário apenas copiar os arquivos de roms e imagens para as pastas de seus respectivos emuladores. O EmulationStation automaticamente irá habilitar os emuladores na interface que possuírem ao menos um jogo.

Dessa forma, sua Raspberry está pronta!

# Extras

**É recomendável fazer uma imagem de backup** da sua raspberry após ter feito todas essas configurações. Desse modo, se algo acontecer, você pode recuperar sem ter que repetir todos os passos. Para criar uma imagem, o processo é semelhante ao citado no passo 1, tanto para windows como para linux.

**Caso você queira recuperar o cartão SD**, é interessante recriar a tabela de partições, já que no Windows apenas a partição de Boot é visível pelo sistema sem o auxílio de alguma aplicação.
No windows, você deve abrir um CMD e digitar:

```sh
DISKPART
```

E então selecionar o disco que corresponde ao seu cartão SD. Uma forma de saber qual é, é montando e desmontando o SD, e vendo qual partição some e aparece quando se usa o comando:

```sh
list part
```

Supondo que o SD seja a partição X, você terá de executar os comandos:

```sh
select part X
delete part
create part pri
```

E pronto!

É isso ai, pessoal! Acho que levei em consideração todos os problemas que tive durante a configuração da minha Raspberry e coloquei aqui. Caso tenha algum erro, ou alguma informação faltando, ou até mesmo mal formatada, me enviem um <a href="mailto:ricardo@busta.com.br" target="_blank">e-mail</a>!

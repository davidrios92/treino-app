import { db, nowIso, type Exercise, type Routine, type RoutineItem } from './db'

interface SeedExercise {
  slug: string
  name_pt: string
  name_en: string
  muscle: string
  img: string
  video?: [id: string, title: string]
  description: string
  tips: string[]
}

// Photos: free-exercise-db (public domain). Videos: verified ≤ 3 min.
export const SEED_EXERCISES: SeedExercise[] = [
  {
    slug: 'supino_reto', name_pt: 'Supino reto com barra', name_en: 'Barbell bench press',
    muscle: 'Peito, tríceps e ombro anterior', img: 'Barbell_Bench_Press_-_Medium_Grip',
    video: ['lWFknlOTbyM', 'How to do the BARBELL BENCH PRESS! | 2 Minute Tutorial'],
    description: 'Deitado no banco reto, você desce a barra até o peito e empurra de volta. É o principal exercício de força para o peito.',
    tips: [
      'Olhos embaixo da barra; pés firmes no chão.',
      'Junte as escápulas (ombros para trás e para baixo) antes de tirar a barra.',
      'Pegada um pouco mais larga que os ombros; desça até tocar a parte baixa do peito.',
      'Cotovelos a ~45° do tronco, não abertos a 90°.',
      'Erro comum: tirar o quadril do banco ou quicar a barra no peito.',
    ],
  },
  {
    slug: 'puxada_frontal', name_pt: 'Puxada frontal (pulley)', name_en: 'Lat pulldown',
    muscle: 'Costas (dorsais) e bíceps', img: 'Wide-Grip_Lat_Pulldown',
    video: ['43hWj8mfYGY', 'How to do the LAT PULLDOWN! | 2 Minute Tutorial'],
    description: 'Sentado na máquina, você puxa a barra de cima até a altura do peito. Alternativa à barra fixa para trabalhar as costas.',
    tips: [
      'Ajuste o apoio das coxas para não levantar do banco.',
      'Pegada um pouco mais larga que os ombros.',
      'Puxe com os cotovelos para baixo, levando a barra até a parte alta do peito.',
      'Suba devagar até esticar os braços.',
      'Erro comum: jogar o corpo muito para trás ou puxar atrás da nuca.',
    ],
  },
  {
    slug: 'barra_fixa', name_pt: 'Barra fixa', name_en: 'Pull-up',
    muscle: 'Costas (dorsais) e bíceps', img: 'Pullups',
    video: ['XB_7En-zf_M', 'How to do a Perfect Pullup'],
    description: 'Pendurado na barra, você puxa o corpo até o queixo passar a barra. Se ainda não conseguir, use a máquina graviton ou um elástico.',
    tips: [
      'Pegada pronada (palmas para frente), um pouco mais larga que os ombros.',
      'Comece com os braços esticados e o abdômen firme.',
      'Puxe levando o peito em direção à barra.',
      'Desça controlando até esticar os braços.',
      'Erro comum: balançar o corpo ou fazer só meia repetição.',
    ],
  },
  {
    slug: 'supino_inclinado_halteres', name_pt: 'Supino inclinado com halteres', name_en: 'Incline dumbbell press',
    muscle: 'Peito superior, ombro e tríceps', img: 'Incline_Dumbbell_Press',
    video: ['IP4oeKh1Sd4', 'How to do the INCLINE DUMBBELL BENCH PRESS! | 2 Minute Tutorial'],
    description: 'No banco inclinado (30–45°), você empurra dois halteres para cima. Foca a parte de cima do peito.',
    tips: [
      'Banco entre 30° e 45° — mais que isso vira exercício de ombro.',
      'Apoie os halteres nas coxas e leve-os para cima ao deitar.',
      'Desça até os halteres ficarem ao lado do peito.',
      'Empurre para cima aproximando levemente os halteres.',
      'Erro comum: descer pouco ou abrir demais os cotovelos.',
    ],
  },
  {
    slug: 'remada_baixa', name_pt: 'Remada baixa no cabo', name_en: 'Seated cable row',
    muscle: 'Costas (meio) e bíceps', img: 'Seated_Cable_Rows',
    video: ['vwHG9Jfu4sw', 'How to do the SEATED CABLE ROW! | 2 Minute Tutorial'],
    description: 'Sentado, com os pés apoiados, você puxa o triângulo (puxador) até a barriga. Trabalha a espessura das costas.',
    tips: [
      'Joelhos levemente dobrados, coluna reta.',
      'Puxe até o abdômen, apertando as escápulas no final.',
      'Volte esticando os braços sem curvar as costas.',
      'Erro comum: balançar o tronco para frente e para trás para ajudar.',
    ],
  },
  {
    slug: 'elevacao_lateral', name_pt: 'Elevação lateral com halteres', name_en: 'Dumbbell lateral raise',
    muscle: 'Ombro (deltoide lateral)', img: 'Side_Lateral_Raise',
    video: ['PzsMitRdI_8', 'How to do the DUMBBELL LATERAL RAISE! | 2 Minute Tutorial'],
    description: 'Em pé, você levanta os halteres para os lados até a altura dos ombros. Deixa os ombros mais largos.',
    tips: [
      'Cotovelos levemente dobrados durante todo o movimento.',
      'Suba até a altura dos ombros, não acima.',
      'Desça devagar (2–3 segundos).',
      'Use peso leve — é um exercício de controle.',
      'Erro comum: dar impulso com o corpo ou subir os ombros até as orelhas.',
    ],
  },
  {
    slug: 'triceps_pulley', name_pt: 'Tríceps pulley (na polia)', name_en: 'Triceps pushdown',
    muscle: 'Tríceps', img: 'Triceps_Pushdown',
    video: ['-zLyUAo1gMw', 'How to do the CABLE TRICEP PUSHDOWN! | 2 Minute Tutorial'],
    description: 'Na polia alta, você empurra a barra ou a corda para baixo até esticar os braços.',
    tips: [
      'Cotovelos colados ao corpo e parados.',
      'Estique totalmente os braços embaixo.',
      'Suba só até o antebraço ficar paralelo ao chão.',
      'Erro comum: mover os cotovelos ou inclinar o corpo para empurrar.',
    ],
  },
  {
    slug: 'rosca_direta_halteres', name_pt: 'Rosca direta com halteres', name_en: 'Dumbbell curl',
    muscle: 'Bíceps', img: 'Dumbbell_Bicep_Curl',
    video: ['XE_pHwbst04', 'Bicep Curls — (DUMBBELL FORM & TECHNIQUE)'],
    description: 'Em pé, com um halter em cada mão, você dobra os cotovelos levando os halteres até os ombros.',
    tips: [
      'Palmas para frente; cotovelos ao lado do corpo.',
      'Suba sem balançar o tronco.',
      'Desça devagar até esticar quase totalmente.',
      'Erro comum: jogar os cotovelos para frente ou usar impulso.',
    ],
  },
  {
    slug: 'agachamento_livre', name_pt: 'Agachamento livre com barra', name_en: 'Barbell squat',
    muscle: 'Quadríceps e glúteos', img: 'Barbell_Squat',
    video: ['aOzrA4FgnM0', 'How to do the BARBELL BACK SQUAT! | 2 Minute Tutorial'],
    description: 'Com a barra apoiada nas costas (trapézio), você agacha e sobe. É o exercício base para pernas.',
    tips: [
      'Pés na largura dos ombros, pontas levemente para fora.',
      'Peito aberto e abdômen firme antes de descer.',
      'Desça como se sentasse numa cadeira, joelhos na direção dos pés.',
      'Desça até a coxa ficar pelo menos paralela ao chão, se a mobilidade permitir.',
      'Erro comum: joelhos para dentro ou calcanhares saindo do chão.',
    ],
  },
  {
    slug: 'terra_romeno', name_pt: 'Levantamento terra romeno (stiff)', name_en: 'Romanian deadlift',
    muscle: 'Posterior de coxa e glúteos', img: 'Romanian_Deadlift',
    video: ['3VXmecChYYM', 'How to do the ROMANIAN DEADLIFT! | 2 Minute Tutorial'],
    description: 'Em pé com a barra, você leva o quadril para trás e desce a barra rente às pernas, sentindo alongar a parte de trás da coxa.',
    tips: [
      'Joelhos levemente dobrados e fixos.',
      'Empurre o quadril para trás; a barra desliza rente às coxas.',
      'Coluna sempre reta — desça até sentir o alongamento (normalmente até o meio da canela).',
      'Suba apertando os glúteos.',
      'Erro comum: curvar as costas ou dobrar demais os joelhos (vira agachamento).',
    ],
  },
  {
    slug: 'leg_press', name_pt: 'Leg press 45°', name_en: 'Leg press',
    muscle: 'Quadríceps e glúteos', img: 'Leg_Press',
    video: ['0hiw3BQ7woU', 'Leg Press Machine - 2 minute tutorial'],
    description: 'Sentado na máquina inclinada, você empurra a plataforma com os pés. Permite usar bastante peso com segurança.',
    tips: [
      'Pés na largura dos ombros, no meio da plataforma.',
      'Desça até os joelhos formarem ~90°, sem tirar o quadril do banco.',
      'Empurre com o calcanhar, sem travar os joelhos no final.',
      'Erro comum: descer demais e "enrolar" o quadril, ou travar os joelhos.',
    ],
  },
  {
    slug: 'mesa_flexora', name_pt: 'Mesa flexora', name_en: 'Lying leg curl',
    muscle: 'Posterior de coxa', img: 'Lying_Leg_Curls',
    video: ['FRy58-v0YII', 'Lying Leg Curl Machine settings for Beginners'],
    description: 'Deitado de bruços na máquina, você dobra os joelhos trazendo o rolo em direção aos glúteos.',
    tips: [
      'O rolo fica logo acima dos calcanhares.',
      'Quadril colado no banco durante todo o movimento.',
      'Suba até o máximo e desça devagar.',
      'Erro comum: levantar o quadril para ajudar.',
    ],
  },
  {
    slug: 'panturrilha_em_pe', name_pt: 'Panturrilha em pé', name_en: 'Standing calf raise',
    muscle: 'Panturrilha (gastrocnêmio)', img: 'Standing_Calf_Raises',
    video: ['95itLfMBG40', 'Elevação de panturrilha em pé (na máquina)'],
    description: 'Em pé na máquina (ou num degrau), você sobe na ponta dos pés e desce alongando.',
    tips: [
      'Apenas a ponta dos pés no apoio; calcanhar livre.',
      'Desça bem até alongar a panturrilha.',
      'Suba o máximo possível e segure 1 segundo em cima.',
      'Erro comum: fazer rápido e com amplitude curta.',
    ],
  },
  {
    slug: 'prancha', name_pt: 'Prancha abdominal', name_en: 'Plank',
    muscle: 'Abdômen e core', img: 'Plank',
    video: ['xe2MXatLTUw', 'The PERFECT Plank'],
    description: 'Apoiado nos antebraços e nas pontas dos pés, você mantém o corpo reto parado. Anote os segundos no campo de reps.',
    tips: [
      'Cotovelos embaixo dos ombros.',
      'Corpo reto da cabeça aos calcanhares; contraia abdômen e glúteos.',
      'Respire normalmente.',
      'Erro comum: deixar o quadril cair ou subir demais.',
    ],
  },
  {
    slug: 'abdominal_polia', name_pt: 'Abdominal na polia (ajoelhado)', name_en: 'Cable crunch',
    muscle: 'Abdômen', img: 'Cable_Crunch',
    video: ['dkGwcfo9zto', 'Como fazer: Abdominal na polia'],
    description: 'Ajoelhado de frente para a polia alta, segurando a corda, você "enrola" o tronco para baixo usando o abdômen.',
    tips: [
      'Segure a corda ao lado da cabeça.',
      'Quadril parado; quem se move é o tronco.',
      'Leve os cotovelos em direção às coxas contraindo o abdômen.',
      'Erro comum: puxar com os braços ou sentar nos calcanhares.',
    ],
  },
  {
    slug: 'elevacao_pernas', name_pt: 'Elevação de pernas deitado', name_en: 'Lying leg raise',
    muscle: 'Abdômen (parte inferior)', img: 'Flat_Bench_Lying_Leg_Raise',
    video: ['kLa7E4YhVQo', 'Como fazer: Elevação de pernas deitado'],
    description: 'Deitado no banco ou no chão, você levanta as pernas esticadas até formar 90° com o tronco e desce devagar.',
    tips: [
      'Mãos segurando o banco ou embaixo do quadril.',
      'Lombar colada no apoio o tempo todo.',
      'Desça devagar sem encostar os pés no chão.',
      'Erro comum: arquear a lombar na descida.',
    ],
  },
  {
    slug: 'desenvolvimento_militar', name_pt: 'Desenvolvimento militar com barra', name_en: 'Overhead press',
    muscle: 'Ombros e tríceps', img: 'Standing_Military_Press',
    video: ['KP1sYz2VICk', 'How to do the BARBELL OVERHEAD MILITARY PRESS! | 2 Minute Tutorial'],
    description: 'Em pé, você empurra a barra da altura dos ombros até acima da cabeça. Principal exercício de força para ombros.',
    tips: [
      'Pegada um pouco mais larga que os ombros; barra apoiada na parte alta do peito.',
      'Glúteos e abdômen contraídos para não arquear as costas.',
      'Empurre a barra para cima, passando a cabeça para frente quando a barra passar o rosto.',
      'Erro comum: inclinar o tronco muito para trás.',
    ],
  },
  {
    slug: 'supino_reto_halteres', name_pt: 'Supino reto com halteres', name_en: 'Dumbbell bench press',
    muscle: 'Peito e tríceps', img: 'Dumbbell_Bench_Press',
    video: ['mTaiQemkEpU', 'The PERFECT Dumbbell Chest Press'],
    description: 'Como o supino reto, mas com halteres. Dá mais amplitude e trabalha cada lado separado.',
    tips: [
      'Apoie os halteres nas coxas e deite levando-os junto.',
      'Escápulas juntas, pés firmes no chão.',
      'Desça até os halteres ficarem ao lado do peito.',
      'Erro comum: bater os halteres em cima ou descer pouco.',
    ],
  },
  {
    slug: 'remada_apoiada', name_pt: 'Remada com apoio no peito', name_en: 'Chest-supported row',
    muscle: 'Costas', img: 'Dumbbell_Incline_Row',
    video: ['czoQ_ncuqqI', 'Setting Up for Chest Supported Dumbbell Rows'],
    description: 'Com o peito apoiado num banco inclinado (ou na máquina de remada apoiada), você puxa os halteres em direção ao quadril.',
    tips: [
      'Banco a ~30–45°; peito colado no apoio o tempo todo.',
      'Puxe com os cotovelos, levando-os para trás.',
      'Aperte as escápulas no final e desça controlando.',
      'Erro comum: tirar o peito do banco para dar impulso.',
    ],
  },
  {
    slug: 'triceps_frances', name_pt: 'Tríceps francês com halter', name_en: 'Overhead triceps extension',
    muscle: 'Tríceps', img: 'Standing_Dumbbell_Triceps_Extension',
    video: ['b_r_LW4HEcM', 'The PERFECT Overhead DB Tricep Extension'],
    description: 'Segurando um halter com as duas mãos atrás da cabeça, você estica os braços para cima. Também pode ser feito na polia com corda.',
    tips: [
      'Cotovelos apontando para cima e próximos da cabeça.',
      'Desça o halter atrás da cabeça até sentir alongar o tríceps.',
      'Estique os braços sem mover os cotovelos.',
      'Erro comum: abrir os cotovelos ou arquear as costas.',
    ],
  },
  {
    slug: 'rosca_martelo', name_pt: 'Rosca martelo', name_en: 'Hammer curl',
    muscle: 'Bíceps e antebraço', img: 'Hammer_Curls',
    video: ['VuEclXR7sZY', 'Como fazer: Rosca martelo'],
    description: 'Como a rosca direta, mas com as palmas viradas uma para a outra (pegada neutra), como se segurasse um martelo.',
    tips: [
      'Palmas viradas para o corpo durante todo o movimento.',
      'Cotovelos parados ao lado do corpo.',
      'Desça devagar.',
      'Erro comum: balançar o corpo.',
    ],
  },
  {
    slug: 'levantamento_terra', name_pt: 'Levantamento terra', name_en: 'Deadlift',
    muscle: 'Posterior de coxa, glúteos e costas', img: 'Barbell_Deadlift',
    video: ['OBNPP1Wl8KA', 'Levantamento terra: erros comuns'],
    description: 'Você levanta a barra do chão até ficar em pé. Exercício muito completo — peça ao personal para conferir sua técnica no começo.',
    tips: [
      'Barra sobre o meio do pé, canela perto da barra.',
      'Pegada logo fora das pernas; coluna reta, peito aberto.',
      'Empurre o chão com as pernas e estenda o quadril, com a barra rente ao corpo.',
      'Desça a barra levando o quadril para trás.',
      'Erro comum: costas curvadas ou barra longe do corpo.',
    ],
  },
  {
    slug: 'agachamento_frontal', name_pt: 'Agachamento frontal', name_en: 'Front squat',
    muscle: 'Quadríceps e core', img: 'Front_Barbell_Squat',
    video: ['_qv0m3tPd3s', 'The PERFECT Front Squat'],
    description: 'Agachamento com a barra apoiada na frente dos ombros. Exige tronco mais reto e foca o quadríceps.',
    tips: [
      'Barra apoiada nos ombros, cotovelos altos apontando para frente.',
      'Tronco o mais reto possível.',
      'Desça controlando, joelhos na direção dos pés.',
      'Erro comum: deixar os cotovelos caírem (a barra rola para frente).',
    ],
  },
  {
    slug: 'agachamento_hack', name_pt: 'Agachamento no hack', name_en: 'Hack squat',
    muscle: 'Quadríceps e glúteos', img: 'Hack_Squat',
    video: ['g9i05umL5vc', 'Como fazer Hack Squat'],
    description: 'Agachamento numa máquina guiada (hack), com as costas apoiadas. Mais seguro para iniciantes.',
    tips: [
      'Costas e ombros bem apoiados.',
      'Pés na largura dos ombros, no meio da plataforma.',
      'Desça até ~90° ou um pouco mais.',
      'Erro comum: tirar os calcanhares da plataforma.',
    ],
  },
  {
    slug: 'agachamento_bulgaro', name_pt: 'Agachamento búlgaro', name_en: 'Bulgarian split squat',
    muscle: 'Quadríceps e glúteos', img: 'Split_Squat_with_Dumbbells',
    video: ['uODWo4YqbT8', 'Como fazer o agachamento búlgaro | 3 passos'],
    description: 'Com o pé de trás apoiado num banco e halteres nas mãos, você agacha com a perna da frente. Faça as reps de uma perna e depois da outra.',
    tips: [
      'Pé de trás apoiado no banco (peito do pé).',
      'Pé da frente longe o suficiente para o joelho não passar muito da ponta do pé.',
      'Desça reto até o joelho de trás quase tocar o chão.',
      'Erro comum: perder o equilíbrio por deixar os pés em linha reta — afaste-os um pouco para os lados.',
    ],
  },
  {
    slug: 'cadeira_extensora', name_pt: 'Cadeira extensora', name_en: 'Leg extension',
    muscle: 'Quadríceps', img: 'Leg_Extensions',
    video: ['uM86QE59Tgc', 'The PERFECT Leg Extension'],
    description: 'Sentado na máquina, você estica as pernas levantando o rolo.',
    tips: [
      'Joelho alinhado com o eixo da máquina.',
      'Rolo apoiado logo acima dos tornozelos.',
      'Estique totalmente, segure 1 segundo e desça devagar.',
      'Erro comum: dar impulso e soltar o peso na descida.',
    ],
  },
  {
    slug: 'cadeira_flexora', name_pt: 'Cadeira flexora', name_en: 'Seated leg curl',
    muscle: 'Posterior de coxa', img: 'Seated_Leg_Curl',
    video: ['xdbEG3xGLI8', 'Dicas para a cadeira flexora'],
    description: 'Sentado na máquina, você dobra os joelhos empurrando o rolo para baixo.',
    tips: [
      'Trave as coxas com o apoio de cima.',
      'Joelho alinhado com o eixo da máquina.',
      'Dobre o máximo possível e volte devagar.',
      'Erro comum: subir rápido demais e perder o controle.',
    ],
  },
  {
    slug: 'panturrilha_sentado', name_pt: 'Panturrilha sentado', name_en: 'Seated calf raise',
    muscle: 'Panturrilha (sóleo)', img: 'Seated_Calf_Raise',
    video: ['60XGTGOjdXA', 'How to do Seated Calf Raises'],
    description: 'Sentado na máquina, com o apoio sobre os joelhos, você sobe na ponta dos pés e desce alongando.',
    tips: [
      'Ponta dos pés no apoio, calcanhar livre.',
      'Desça bem e suba o máximo possível.',
      'Segure 1 segundo em cima.',
      'Erro comum: amplitude curta e repetições rápidas.',
    ],
  },
]

type SeedItem = {
  ex: string[]
  sets: number
  opt?: number
  reps?: [number, number]
  note?: string
  rest: number
  perSide?: boolean
  notes?: string
}

export const SEED_ROUTINES: { name: string; short: string; items: SeedItem[] }[] = [
  {
    name: 'Superiores A',
    short: 'A',
    items: [
      { ex: ['supino_reto'], sets: 3, reps: [6, 10], rest: 150 },
      { ex: ['puxada_frontal', 'barra_fixa'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['supino_inclinado_halteres'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['remada_baixa'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['elevacao_lateral'], sets: 3, reps: [12, 20], rest: 75 },
      { ex: ['triceps_pulley'], sets: 2, opt: 1, reps: [10, 15], rest: 75 },
      { ex: ['rosca_direta_halteres'], sets: 2, opt: 1, reps: [10, 15], rest: 75 },
    ],
  },
  {
    name: 'Inferiores A',
    short: 'B',
    items: [
      { ex: ['agachamento_livre'], sets: 3, reps: [6, 10], rest: 180 },
      { ex: ['terra_romeno'], sets: 3, reps: [8, 12], rest: 150 },
      { ex: ['leg_press'], sets: 3, reps: [10, 15], rest: 120 },
      { ex: ['mesa_flexora'], sets: 3, reps: [10, 15], rest: 90 },
      { ex: ['panturrilha_em_pe'], sets: 3, reps: [10, 15], rest: 75 },
      { ex: ['abdominal_polia', 'elevacao_pernas', 'prancha'], sets: 3, note: '10–20', rest: 60, notes: 'Prancha: anote os segundos no campo de reps.' },
    ],
  },
  {
    name: 'Superiores B',
    short: 'C',
    items: [
      { ex: ['desenvolvimento_militar'], sets: 3, reps: [6, 10], rest: 150 },
      { ex: ['barra_fixa', 'puxada_frontal'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['supino_reto_halteres'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['remada_apoiada'], sets: 3, reps: [8, 12], rest: 120 },
      { ex: ['elevacao_lateral'], sets: 3, reps: [12, 20], rest: 75 },
      { ex: ['triceps_frances'], sets: 2, opt: 1, reps: [10, 15], rest: 75 },
      { ex: ['rosca_martelo'], sets: 2, opt: 1, reps: [10, 15], rest: 75 },
    ],
  },
  {
    name: 'Inferiores B',
    short: 'D',
    items: [
      { ex: ['levantamento_terra', 'terra_romeno'], sets: 3, reps: [5, 8], rest: 180 },
      { ex: ['agachamento_frontal', 'agachamento_hack'], sets: 3, reps: [8, 12], rest: 150 },
      { ex: ['agachamento_bulgaro'], sets: 3, reps: [8, 12], rest: 90, perSide: true },
      { ex: ['cadeira_extensora'], sets: 2, opt: 1, reps: [10, 15], rest: 75 },
      { ex: ['cadeira_flexora'], sets: 3, reps: [10, 15], rest: 90 },
      { ex: ['panturrilha_sentado', 'panturrilha_em_pe'], sets: 3, reps: [10, 15], rest: 75 },
      { ex: ['abdominal_polia', 'elevacao_pernas', 'prancha'], sets: 3, note: '10–20', rest: 60, notes: 'Prancha: anote os segundos no campo de reps.' },
    ],
  },
]

/** Same user + key always yields the same UUID, so seeding on two devices doesn't duplicate rows. */
async function stableId(userId: string, key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${userId}:${key}`))
  const h = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`
}

export async function seedIfEmpty(userId: string) {
  const hasData = (await db.exercises.count()) > 0 || (await db.routines.count()) > 0
  if (hasData) return
  const ts = nowIso()
  const base = { updated_at: ts, deleted: false, dirty: 1 as const }

  const exIds: Record<string, string> = {}
  const exercises: Exercise[] = []
  for (const e of SEED_EXERCISES) {
    const id = await stableId(userId, `ex:${e.slug}`)
    exIds[e.slug] = id
    exercises.push({
      ...base, id, slug: e.slug, name_pt: e.name_pt, name_en: e.name_en, muscle: e.muscle,
      description: e.description, tips: e.tips, images: [`/ex/${e.img}/0.jpg`, `/ex/${e.img}/1.jpg`],
      video_id: e.video?.[0] ?? null, video_title: e.video?.[1] ?? null, is_custom: false,
    })
  }

  const routines: Routine[] = []
  const items: RoutineItem[] = []
  for (const [ri, r] of SEED_ROUTINES.entries()) {
    const rid = await stableId(userId, `routine:${ri}`)
    routines.push({ ...base, id: rid, name: r.name, short: r.short, position: ri })
    for (const [ii, it] of r.items.entries()) {
      items.push({
        ...base, id: await stableId(userId, `item:${ri}:${ii}`), routine_id: rid, position: ii,
        exercise_ids: it.ex.map((s) => exIds[s]), sets: it.sets, sets_optional: it.opt ?? 0,
        reps_min: it.reps?.[0] ?? null, reps_max: it.reps?.[1] ?? null, reps_note: it.note ?? null,
        rest_sec: it.rest, per_side: it.perSide ?? false, notes: it.notes ?? null,
      })
    }
  }

  await db.transaction('rw', [db.exercises, db.routines, db.routine_items, db.cycles, db.settings], async () => {
    await db.exercises.bulkPut(exercises)
    await db.routines.bulkPut(routines)
    await db.routine_items.bulkPut(items)
    if ((await db.cycles.count()) === 0) {
      await db.cycles.put({ ...base, id: await stableId(userId, 'cycle:1'), started_at: ts, ended_at: null, target: 50, notes: null })
    }
    if ((await db.settings.count()) === 0) {
      await db.settings.put({ ...base, id: await stableId(userId, 'settings'), unit: 'kg' })
    }
  })
}

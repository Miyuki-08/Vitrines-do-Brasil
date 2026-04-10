const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agencia',
  password: '123456',
  port: 5432,
});

const horariosValidos = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

// 🔥 ROTA DE AGENDAMENTO
app.post('/agendar', async (req, res) => {
  const { nome, telefone, data, hora } = req.body;

  // ✅ validar horário
  if (!horariosValidos.includes(hora)) {
    return res.json({ erro: 'Horário inválido' });
  }

  // ✅ validar data (amanhã até +10 dias)
  const hoje = new Date();
  const dataEscolhida = new Date(data);

  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const limite = new Date();
  limite.setDate(hoje.getDate() + 10);

  if (dataEscolhida < amanha || dataEscolhida > limite) {
    return res.json({ erro: 'Data fora do permitido' });
  }

  try {
    // verifica se já existe
    const check = await pool.query(
      'SELECT * FROM agendamentos WHERE data=$1 AND hora=$2',
      [data, hora]
    );

    if (check.rows.length > 0) {
      return res.json({ erro: 'Horário já ocupado' });
    }

    // insere
    await pool.query(
      'INSERT INTO agendamentos (nome_cliente, telefone, data, hora) VALUES ($1, $2, $3, $4)',
      [nome, telefone, data, hora]
    );

    res.json({ sucesso: 'Agendado com sucesso' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// 🔥 ROTA DE HORÁRIOS
app.get('/horarios/:data', async (req, res) => {
  const { data } = req.params;

  try {
    const result = await pool.query(
      'SELECT hora FROM agendamentos WHERE data = $1',
      [data]
    );

    // ajustar formato da hora
    const ocupados = result.rows.map(r => r.hora.toString().substring(0,5));

    res.json({ ocupados });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
});

app.listen(PORT, () => {
  console.log('Servidor rodando');
});
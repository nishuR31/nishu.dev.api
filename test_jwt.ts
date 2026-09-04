import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';

const app = Fastify({ logger: true });

app.register(fastifyCookie, {
  secret: "my-secret",
  parseOptions: {}
});

app.register(fastifyJwt, {
  secret: "my-jwt-secret",
  cookie: {
    cookieName: 'access_token',
    signed: false
  }
});

app.get('/login', async (request, reply) => {
  const token = await reply.jwtSign({ id: 1, role: 'developer' });
  reply.setCookie('access_token', token, {
    path: '/',
    httpOnly: true
  });
  return { token };
});

app.get('/me', async (request, reply) => {
  try {
    if (request.cookies.access_token) {
      await request.jwtVerify({ onlyCookie: true });
    } else {
      await request.jwtVerify();
    }
    return { success: true, user: request.user };
  } catch (err) {
    return reply.status(401).send({ error: "missing or invalid", details: err.message });
  }
});

app.listen({ port: 3500 }, (err) => {
  if (err) throw err;
  console.log("Listening on 3500");
});

const fs = require('fs');
const file = 'src/modules/portfolio/portfolio.controller.ts';
let code = fs.readFileSync(file, 'utf8');

function addBulk(model, schema, name) {
  const func = `
  static async bulkUpdate${name}(req: FastifyRequest, reply: FastifyReply) {
    try {
      const userPayload = req.user as { id: string };
      const rawArray = req.body as any[];
      if (!Array.isArray(rawArray)) return reply.code(400).send({ success: false, message: "Expected an array" });
      const portfolio = await prisma.portfolioData.findUnique({ where: { userId: userPayload.id } });
      if (!portfolio) return reply.code(404).send({ success: false, message: "Portfolio not found" });
      const parsedArray = rawArray.map(item => ${schema}.parse(item));
      await prisma.$transaction(async (tx) => {
        await tx.${model}.deleteMany({ where: { portfolioId: portfolio.id } });
        for (const item of parsedArray) {
          await tx.${model}.create({ data: { ...item, portfolioId: portfolio.id } });
        }
      });
      await PortfolioController.invalidateCache(req.server.redis);
      return reply.send({ success: true, message: "${name} bulk updated" });
    } catch (e) {
      return reply.code(400).send({ success: false, message: "Failed to bulk update ${name}", errors: e });
    }
  }
`;
  const target = `static async create${name.slice(0, -1)}(req: FastifyRequest, reply: FastifyReply) {`;
  if (code.includes(target) && !code.includes(`bulkUpdate${name}`)) {
    code = code.replace(target, func + '\n  ' + target);
  }
}

addBulk('project', 'ProjectSchema', 'Projects');
addBulk('experience', 'ExperienceSchema', 'Experiences');
addBulk('certificate', 'CertificateSchema', 'Certificates');
addBulk('service', 'ServiceSchema', 'Services');
addBulk('testimonial', 'TestimonialSchema', 'Testimonials');
addBulk('education', 'EducationSchema', 'Education');

fs.writeFileSync(file, code);

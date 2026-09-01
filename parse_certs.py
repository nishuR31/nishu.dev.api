import re
import urllib.parse
import json

lines = """
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Comprehensive%20JavaScript%20Course%20From%20Beginner%20to%20Full%20Stack%20Pro.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Full%20Stack%20Web%20Development%20Bootcamp%20(HTML,%20CSS,%20JavaScript,jQuery,%20Web%20Templates,%20PHP,%20MySQL,MySQLi,%20with%20Source%20Code).pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/git.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/certificate-zn269pmhqc4t-1773898986.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/htmlForBiginners.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Introduction%20to%20Python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/JavaScript%20Functions%20&%20Arrays%20in%20JavaScript.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/JavaScript%20Getting%20Started%20with%20JavaScript%20Programming.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/js%20array%20func.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/js%20from%20scratch.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20JavaScript%20Basics%20in%20Under%206%20Hours.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20Javascript%20Programming%20Language%20With%20Practical%20Interaction.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Learn%20the%20Basics%20of%20HTML%20and%20CSS%20and%20get%20Started%20with%20Web%20Design.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Level%20up%20your%20skills%20in%20HTML%20and%20CSS%20,%20learn%20how%20to%20create%20responsive%20web%20templates%20pt3.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/12.png",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/A%20Comprehensive%20Guide%20to%20HTML%20Online%20Course.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/MySQL%20Database%20Development%20Introduction.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Nishan%20-%20Participation%20Certificate.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Nishan%20sql.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Picsart_25-05-17_14-08-00-215.png",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/prompting.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20Clean%20Coding.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20dev%20first%20step.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Python%20Development%20Essentials%20course%20by%20MTF%20Institute.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Start%20Your%20Career%20With%20Python.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/tsc.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/Upgrade%20your%20HTML%20&%20CSS%20conception%20and%20start%20building%20awesome%20templates%20pt2.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/website%20portfolio%20using%20gpt.pdf",
    },
    {
      url: "https://dzrkiprblxcrdaijnuaf.supabase.co/storage/v1/object/public/certificates/WebDevSeminar.pdf",
    },
"""

matches = re.findall(r'url:\s*"([^"]+)"', lines)

certs = []
for i, url in enumerate(matches, 1):
    filename = url.split('/')[-1]
    decoded = urllib.parse.unquote(filename)
    if '.' in decoded:
        title = decoded.rsplit('.', 1)[0]
        ext = decoded.rsplit('.', 1)[1].lower()
    else:
        title = decoded
        ext = 'pdf'
    
    ctype = 'image' if ext in ['png', 'jpg', 'jpeg', 'webp', 'avif'] else 'pdf'
    
    if title == '12': title = 'Certificate of Appreciation'
    if title == 'Picsart_25-05-17_14-08-00-215': title = 'Workshop Certificate'
    if title == 'certificate-zn269pmhqc4t-1773898986': title = 'HackerRank Certificate'
    
    title = title.replace('-', ' ').title()
    title = re.sub(r'\s+', ' ', title).strip()
    
    certs.append({
        'id': f'cert-{i}',
        'title': title,
        'url': url,
        'type': ctype
    })

print("  certificates: [")
for c in certs:
    print(f"    {{")
    print(f"      id: \"{c['id']}\",")
    print(f"      title: \"{c['title']}\",")
    print(f"      url: \"{c['url']}\",")
    print(f"      type: \"{c['type']}\",")
    print(f"    }},")
print("  ],")

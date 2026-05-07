import pathlib,re
text=pathlib.Path('server/api/branches/index.get.ts').read_text(encoding='utf-8')
# Extract message text between quotes in the statusMessage line
for line in text.splitlines():
    if 'statusMessage:' in line:
        msg=line.split("statusMessage:",1)[1]
        msg=msg.strip()
        # strip trailing comma
        if msg.endswith(','):
            msg=msg[:-1]
        # remove surrounding quotes
        if msg[0] in "'\"":
            q=msg[0]
            msg=msg[1:msg.rfind(q)]
        print('msg',msg)
        print('codepoints first 20', [hex(ord(c)) for c in msg[:20]])
        break

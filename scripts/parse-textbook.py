"""
课本词汇解析器
输入格式：
Unit1 文具
pen /pen/ 钢笔
pencil /ˈpensl/ 铅笔
...

输出：JSON [{name, trans, usphone, ukphone}]
"""

import json
import re
import os

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'subpackages', 'data')

def parse_textbook_text(text):
    """
    解析课本词汇文本
    返回: {unit_name: [{name, trans, usphone, ukphone}]}
    """
    units = {}
    current_unit = None
    current_words = []

    for line in text.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        # 检测 Unit 行: "Unit1 文具" 或 "Unit 1 文具"
        unit_match = re.match(r'^Unit\s*(\d+)\s+(.+)', line)
        if unit_match:
            if current_unit:
                units[current_unit] = current_words
            current_unit = f"Unit {unit_match.group(1)} {unit_match.group(2)}"
            current_words = []
            continue

        # 解析单词行: "pen /pen/ 钢笔" 或 "pencil box /ˈpensl bɒks/ 铅笔盒"
        word_match = re.match(r'^(.+?)\s+/([^/]+)/\s*(.*)', line)
        if word_match and current_unit:
            name = word_match.group(1).strip()
            usphone = word_match.group(2).strip()
            trans = word_match.group(3).strip()
            current_words.append({
                'name': name,
                'trans': [trans] if trans else [],
                'usphone': usphone,
                'ukphone': '',
            })

    if current_unit:
        units[current_unit] = current_words

    return units


def save_textbook(textbook_id, name, grade, category, units):
    """保存课本词典为 JSON"""
    words = []
    for unit_name, unit_words in units.items():
        words.extend(unit_words)

    filename = f"{textbook_id}.json"
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, separators=(',', ':'))

    print(f"{name}: {len(words)} words, {os.path.getsize(filepath)//1024}KB")
    return words


if __name__ == '__main__':
    # 三年级上册
    TEXT_3A = """
Unit1 文具
pen /pen/ 钢笔
pencil /ˈpensl/ 铅笔
pencil box /ˈpensl bɒks/ 铅笔盒
ruler /ˈruːlə(r)/ 尺子
eraser /ɪˈreɪzə(r)/ 橡皮
crayon /ˈkreɪɒn/ 蜡笔
bag /bæɡ/ 书包
book /bʊk/ 书
Unit2 颜色
red /red/ 红色；红色的
yellow /ˈjeləʊ/ 黄色；黄色的
green /ɡriːn/ 绿色；绿色的
blue /bluː/ 蓝色；蓝色的
black /blæk/ 黑色；黑色的
white /waɪt/ 白色；白色的
orange /ˈɒrɪndʒ/ 橙色；橙色的
brown /braʊn/ 棕色；棕色的
Unit3 身体部位
head /hed/ 头
face /feɪs/ 脸
ear /ɪə(r)/ 耳朵
eye /aɪ/ 眼睛
nose /nəʊz/ 鼻子
mouth /maʊθ/ 嘴
arm /ɑːm/ 胳膊
hand /hænd/ 手
body /ˈbɒdi/ 身体
leg /leɡ/ 腿
foot /fʊt/ 脚
Unit4 动物
cat /kæt/ 猫
dog /dɒɡ/ 狗
monkey /ˈmʌŋki/ 猴子
panda /ˈpændə/ 大熊猫
duck /dʌk/ 鸭子
pig /pɪɡ/ 猪
bear /beə(r)/ 熊
elephant /ˈelɪfənt/ 大象
bird /bɜːd/ 鸟
tiger /ˈtaɪɡə(r)/ 老虎
zoo /zuː/ 动物园
Unit5 食物饮品
bread /bred/ 面包
juice /dʒuːs/ 果汁
egg /eɡ/ 鸡蛋
milk /mɪlk/ 牛奶
water /ˈwɔːtə(r)/ 水
cake /keɪk/ 蛋糕
fish /fɪʃ/ 鱼
rice /raɪs/ 米饭
Unit6 数字 1–10
one /wʌn/ 一
two /tuː/ 二
three /θriː/ 三
four /fɔː(r)/ 四
five /faɪv/ 五
six /sɪks/ 六
seven /ˈsevən/ 七
eight /eɪt/ 八
nine /naɪn/ 九
ten /ten/ 十
"""

    units = parse_textbook_text(TEXT_3A)
    save_textbook('pep_3a', '三年级上册', '小学三年级', '课本单词', units)
    print("Done!")

==========

为下面的风格（附在最后）想一首歌的设定。
1. 首先，仔细分析风格词，推敲对应的感情
2. 根据感情，想象符合的文学作品里，有哪个符合的故事片段，写出来。不一定要名著，口水小说或网络小说作品都可以。
3. 给出10个故事或设定片段。
4. 在根据你对歌曲风格的了解，根据流行的同类歌曲，给出3个类似歌曲的设定。

风格：


==========

你是思维活跃的歌词填写大师。上面已经告诉你这首歌适合什么样的风格了，有个什么样的基本的故事了，你要把它向那个方向加强。
你给歌曲起一个直击灵魂的名字，让后仔细填词。你个人很喜欢：
  - 在歌曲开头增加1到2句对话，标记成人声。注意标注男女声音。
  - *或者*，在歌曲开头增加纯音乐的开场，有时候长达45秒
  - 在歌曲中间增加纯乐器的段落
  - 你喜欢用双语：中文为主，偶尔加一点其他英文。

==========

你是非常严格的音乐总监，你再检查一遍，注意看：
  - 对每一段：
    - 段落开头有段落注释吗？比如verse, hook。有旋律的段落要加简短的风格，比如"[hook: melodic rap]"
    - 女声的段落有用SUNO风格词explicitly标注是女声吗？
    - 歌词足够押韵吗？押韵可以不严格(比如ei和ui可以押韵)
    - 如果是黑暗系音乐，你还在意在句子结尾加一个语气词跟最后一个字造成回声效果般的押韵，比如"그늘마저 삼킨 밤 bam"
    - 如果是嘻哈音乐，要不要加入一些前后重叠字（比如"我们 门后")？
    - 如果是嘻哈音乐，加入一直反复的歌词或句子，比如“rain \n rain \n rain"，会比较好吗？
    - 要不要再加入更多的风格和乐器修饰词？
    - 能由人声直接念出来的短促声音 → 裸写，如 tch、bam
    - 需要营造的环境音效/氛围/状态，意境AI人声指导，要用"[]"且要用英文，如 [breathing]、[slow inhale]、[distant thud]
    - "()"里只能有要念出来的内容，音效和指导AI人声状态都要用"[]"
    - "[]"里只能有不要念出来的内容，比如音效和元标签。如果有要弱化念出的内容，用"()"
    - 英文短促的声音，比如tch，会增加押韵吗？符合歌曲风格吗？不符合的话就删除
  - 对全歌：
    - **特别注意** 歌词和歌词中的修饰词符合歌的风格吗？
    - verse是不是太工整了？有没有长短交错？
    - SUNO的style标注是对整首歌的；对段落的描述要直接加在歌词段落前
    - 音效注释有没有太复杂？SUNO会不会不能做出这么复杂的音效？
    - 审查SUNO歌词时，需按段落标签数量（每段约40秒）与风格提示词中的延展高危词综合预估时长。cypher不能超过5分钟，其他的歌曲不要超过3分半钟。注意“高危词”，并警告并建议删减段落、替换中性词。单独核查器乐段落，有明确小节数则按172 BPM换算，未标注则默认警告可能生成30-60秒，且全程严禁使用“唱词字数÷BPM”的无效公式。**限制时长的控制词没有用**，必须从内容入手修改。
    - 逐词审查所有歌词与风格提示词，标记并删除任何与歌曲目标风格冲突的意象词汇。即使这些词后面跟着 reversed、detuned 等处理标记，也视为高危词，因为 AI 可能优先响应词根而非处理指令。

  - 歌词标签简洁性强制审查：
    - 段落标签可以包含类型、风格、人声性别、声质等指令，如 [Verse 3: Old School Boom Bap] [Female, husky powerful]。
    - 禁止在单个标签内用括号嵌套角色背景故事，像 [Female (Tsunade, exhaling smoke slowly)] 这样。
    - 角色名和声质要么放歌词段落标签，不要放SUNO prompt。
    - 元标签跟歌曲风格契合吗？

给出整体歌曲评价分数(1-10分制)，再每段或整体给出修改建议。

==========

你是勤勉的作曲人，你认真听取了上面的意见，并发挥了自己的创作力修改了原稿，努力让歌词靠近评委们给出的10分。你有自己的思考，并不会完全听从音乐总监的意见。分数约低，你修改的越多，分数约接近10分，你修改的越少。

你会特别注意：
- 歌词是否太单调？最好有长有短
- 歌词的风格是嘻哈吗？如果是的话，要不要加更多单字来押韵或符合场景的声效(比如"[breathing]")？
- 歌词的风格是嘻哈吗？如果是的话，verse是不是太单调？要不要不同的verse配上不同的语速和说唱风格？
- 开头要不要再长一些，加更多乐器和音效？

给出歌名，可以直接拷贝的SUNO prompt,和可以直接拷贝得整首歌的歌词，记得移除对歌曲生成没有作用的注释词。

==========

你是吹毛求疵的押韵歌词达人，你要让歌词成为艺术品。你可以忍受押韵不严格(比如ei和ui可以押韵)，但不能忍受押韵不华丽。你关注的点：
- 单押：每句话的结尾词押韵
- 双押：一句话中连续两字的词跟另一句话的连续两字的词押韵
- 三押：一句话中连续三字的词跟另一句话的连续三字的词押韵
- 四押：一句话中连续四字的词跟另一句话的连续四字的词押韵
- 五押：一句话中连续五字的词跟另一句话的连续五字的词押韵
- 隔句押韵：押韵的句子不是相邻的句子。比如：
     - 例1：奇数行的句子是三押，偶数行的句子是双押
     - 例2：每隔两句是单押，其他句子有自己的押韵
- 要不要加入一些前后重叠字（比如"我们 门后")？
- 加入一直反复的歌词或句子，比如“rain \n rain \n rain"，会比较好吗？
- verse是不是太工整了？有长有短有快有慢的verse才好听
- 人声打击乐标注法: 作词人只用方括号框出需要**精准同步808底鼓、把韵脚当鼓打的音节**，其他旋律或念白部分绝不标注，以此在词谱上直接划分“鼓点语言”与“叙述语言”。听感上，那些框住的音节会像被拆解成打击乐器，在鼓点落下的瞬间发出一记闷重撞击后坠入寂静。
- **你只在乎声韵的吻合**，你不在乎意义的重叠，回声，寓意等等

接下来到你发挥的时候了，对这首歌词给出押韵的评价分数(1-10分制)，再每段或整体给出修改建议。

==========

你是资深音乐风格分析师，你只关注一点：这首歌的元标签和SUNO style prompt风格是否能完全表达歌词想展现的意境。你不会注意歌词怎么精修，你只在意契合度，不够的时候你会建议重写。

**一行一行的看歌词**
对每一行：有没有元标签？有的话会不会太复杂？有没有嵌套？这么复杂SUNO可以理解吗？可以精简吗？
 
**整体风格SUNO Prompt是关于整首歌的**
风格词会不会有风格混合？会不会有冲突的风格词混合在里面？整首歌的风格修饰词跟歌词契合吗？有没有过于复杂以至于SUNO可能会理解错误？可以精简风格来更好的专注在核心风格上面吗？


==========

你是最终音乐定稿人，你有丰富的市场经验和SUNO制作的知识。
你明白分析师，总监，和作曲人各有各的坚持。你综合他们的意见，给出你觉得最迎合市场和**SUNO能力**的最终稿。
给出歌名，有拷贝按钮的SUNO prompt,和有拷贝按钮的整首歌的歌词，记得移除对歌曲生成没有作用的注释词。
给出你给歌曲的(1-10)分数。

==========

根据以下歌词和歌的风格构想合适的中文图片生成词。给10组，要有艺术感，描述要详尽。


==========

























==========


你是一位资深风格策划师。你的任务是基于最后面提供的歌名（第一行）和歌词，策划 10 个极其详尽且各具特色的 SUNO AI 风格提示词 (Style Prompts)。

要求：
1. **必须是纯英文**。
2. **详尽度**：每个提示词必须详细，包含精确节奏(BPM)、人声质感(如 raspy, soulful)、具体乐器采样及演奏技巧、空间氛围与音效。
3. **格式**：每个提示词前加 '-'，且提示词之间用空行分隔。
4. **纯粹性**：直接输出列表，不要多余解释、引言或理由。
5. **要大胆发挥想象力**：找出最适合歌词的曲风


**特别注意**：要把歌曲做成适合现在审美的**现代中文嘻哈**音乐，要**迎合市场**。

歌名以及歌词：



==========


根据前面提供的的歌名，歌词，和选择的歌曲风格，完成下面任务。

----- 先输出加了元标签的歌词 -----

你是一位专业的 SUNO AI 音乐总监。歌曲的风格和歌词已经在上面给出了。你的任务是为歌词添加专业的 Meta Tags把它变成**适合给出风格**的**现代中文嘻哈**的音乐。

【！！！法律级核心禁令 - 绝对严禁违背！！！】
1. **严禁修改歌词原文**：歌词文本是【神圣不可触碰】的。原版歌词要全部保留。
2. **严禁中括号内含中文**：中括号 [] 内只能包含英文描述。绝对不能出现中文歌词。
3. **位置与合并**：标注必须置于段落【正上方】，必须合并到【唯一的一对】中括号 [] 内。严禁 [A][B] 格式。
4. **独立占行**：标注行必须是独立的。下方紧跟对应的原始歌词。

【内容逻辑】
- 在每一段歌词开始前，插入一行详尽的英文标注（结构, 能量, 人声, 配器）。
- 保持标题开头。除了添加标注，严禁改动任何原有排版或文字。
- 要**脑洞大开** 大胆发挥想象力

----- 再输出SUNO Prompts -----

你对之前的歌曲风格SUNO prompt进行了审视，并根据你对SUNO AI的理解进行了加强。
同时给出预估歌曲时长。

----- 再给出图片 -----

给出符合歌曲意境的10组图片生成词，要用中文。

----- 最后的要求 -----

完成上面的任务，输出要用code block。






==========








【！！！法律级核心禁令 - 绝对严禁违背！！！】
1. **严禁修改歌词原文**：歌词文本是【神圣不可触碰】的。原版歌词要全部保留。
2. 但是，**如果会让内容更好的话**，你可以在原版歌词里偶尔添加几句英文。如果添加的话，要押韵，而且不要加"check", "yo"，之类的废话。
3. **严禁中括号内含中文**：中括号 [] 内只能包含英文描述。绝对不能出现中文歌词。
4. **位置与合并**：标注必须置于段落【正上方】，必须合并到【唯一的一对】中括号 [] 内。严禁 [A][B] 格式。
5. **独立占行**：标注行必须是独立的。下方紧跟对应的原始歌词。


























[silence for 60 seconds]

[60 seconds of silence]

- Melancholic Cinematic Trap: BPM 78, breathy auto-tuned melodic rap with vulnerable cracks, felt piano and reversed string swells, deep rumbling 808 sub-bass, sparse trap hi-hats with triplet rolls, rain on window ambience, wide stereo reverb, heartbeat pulse underlying chorus, vinyl dust pops.

- Emo Rap Meets Lo-fi Bedroom Pop: BPM 82, strained emotional delivery with whispered ad-libs, warm tape-saturated Rhodes electric piano, soft guitar harmonics, dusty boom bap drum breaks with sidechain compression, intimate room tone, nostalgic crackle, distant thunder and flickering neon hum, bittersweet and fragile.

- Cloud Rap with Ethereal Hyperpop Edge: BPM 90, pitched-up breathy vocal chops and glitch effects, lush synth pads and crystalline arpeggios, bitcrushed 808 subs, rapid stuttering hi-hats, celestial reverb tails, momentary digital silence drops, starlight shimmer sound design, emotionally shattered but beautiful.

- Orchestral Sadcore Trap: BPM 75, raspy spoken-sung delivery building to powerful belted notes, cinematic string quartet performing poignant stabs and legato lines, heavy 808 slides, trap snare rolls, grand hall reverb, heartbeat sub-bass pulse, music box melody that slows and warps into oblivion during the outro.

- Glitch-Hop Time Travel Ballad: BPM 85, soulful melancholic rap with vocoder harmonies, reversed piano loops and glitched vocal samples, analog synth bass with envelope filter, broken beat machine rhythms, vinyl stop and rewind effects, space echoes, radio static and distorted time-stretched whispers of the chorus, creating a disorienting "wrong timeline" sensation.










const { Util, MessageEmbed } = require("discord.js");
const ytdl = require("ytdl-core");
const ytdlDiscord = require("discord-ytdl-core");
const sendError = require("../util/error");
const scdl = require("soundcloud-downloader").default;

module.exports = {
    async play(song, message) {
        const queue = message.client.queue.get(message.guild.id);
        if (!song) {
            sendError(
                "Sorry But You Can't Stay 24/7 In A Call With Me IF You Thing This Is An Error Contact @Emerald#4028 Go Subscribe To: [Zimber Playz](https://www.youtube.com/channel/UC6oTBDnsLwPHssVgUTV21ww) And [Herobrine Gaming](https://www.youtube.com/channel/UC6oTBDnsLwPHssVgUTV21ww)",
                message.channel
            );
            message.guild.me.voice.channel.leave(); //If you want your bot stay in vc 24/7 remove this line :D
            message.client.queue.delete(message.guild.id);
            return;
        }
        let stream;
        let streamType;

        try {
            if (song.url.includes("soundcloud.com")) {
                try {
                    stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, client.config.SOUNDCLOUD);
                } catch (error) {
                    stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, client.config.SOUNDCLOUD);
                    streamType = "unknown";
                }
            } else if (song.url.includes("youtube.com")) {
                stream = await ytdlDiscord(song.url, { filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25, opusEncoded: true });
                streamType = "opus";
                stream.on("error", function (er) {
                    if (er) {
                        if (queue) {
                            module.exports.play(queue.songs[0], message);
                            return sendError(`Don't Worry!\nPossible type \`${er}\``, message.channel);
                        }
                    }
                });
            }
        } catch (error) {
            if (queue) {
                queue.songs.shift();
                module.exports.play(queue.songs[0], message);
            }
        }

        queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));

        const dispatcher = queue.connection
            .play(stream, { type: streamType })
            .on("finish", () => {
                const shiffed = queue.songs.shift();
                if (queue.loop === true) {
                    queue.songs.push(shiffed);
                }
                module.exports.play(queue.songs[0], message);
            })
            .on("error", (err) => {
                console.error(err);
                queue.songs.shift();
                module.exports.play(queue.songs[0], message);
            });

        dispatcher.setVolumeLogarithmic(queue.volume / 100);

        let thing = new MessageEmbed()
            .setAuthor("Started Playing Music!", "https://raw.githubusercontent.com/SudhanPlayz/Discord-MusicBot/master/assets/Music.gif")
            .setThumbnail(song.img)
            .setColor("BLUE")
            .addField("Name", song.title, true)
            .addField("Duration", song.duration, true)
            .addField("Requested by", song.req.tag, true)
            .setFooter(`Views: ${song.views} | ${song.ago}`);
        queue.textChannel.send(thing);
    },
};

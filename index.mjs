import express from 'express';
import fetch from 'node-fetch';

const app = express();
let isFeatured = [];
let featured = [];
let galleryImg = [];
let galleryDescription = [];
let galleryWebURL = [];
let artworkImg = [];
let artworkTitle = [];
let artworkArtist = [];
let artworkDescription = [];
let artworkOrigin = [];
let videoTitle = '';
let videoArtist = '';
let videoMedium = '';
let videoDate = '';
let videoDescription = '';
let videoImg = '';
let videoId = '';
let soundTitle = '';
let soundArtist = '';
let soundDate = '';
let soundDescription = '';
let soundImg = '';
let soundId = '';
let hasSoundMedia = '';

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
    res.render('index');
});

app.get('/artwork', async (req, res) => {
    let page = Math.max(1, parseInt(req.query.page) || 1);
    let url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_on_view]=true&page=${page}&limit=5`;

    let response = await fetch(url);
    let artworksInfo = await response.json();

    await checkArtwork(artworksInfo);
    renderArtwork(res, 'artwork', page);
});

app.get('/videos', async (req, res) => {
    let page = Math.max(1, parseInt(req.query.page) || 1);

    let url = `https://api.artic.edu/api/v1/artworks/search?q=video&page=${page}&limit=12`;
    let response = await fetch(url);
    let data = await response.json();

    let detailed = await Promise.all(
        data.data.map(async (item) => {
            let r = await fetch(item.api_link);
            let detail = await r.json();
            return detail.data;
        })
    );

    let videos = detailed.filter((art) =>
        (art.medium_display || "").toLowerCase().includes("video") ||
        (art.artwork_type_title || "").toLowerCase().includes("video") ||
        (art.classification_titles || []).some(x => x.toLowerCase().includes("video"))
    );

    checkVideos(videos);
    renderVideos(res, 'videos', page);
});

app.get('/gallery', async (req, res) => {
    let page = Math.max(1, parseInt(req.query.page) || 1);

    let url = `https://api.artic.edu/api/v1/exhibitions?page=${page}&limit=2`;
    let response = await fetch(url);
    let exibitionsInfo = await response.json();

    checkGallery(exibitionsInfo);
    renderGallery(res, 'gallery', exibitionsInfo, page);
});

app.get('/sounds', async (req, res) => {
    let page = Math.max(1, parseInt(req.query.page) || 1);

    let url = `https://api.artic.edu/api/v1/artworks/search?q=audio&page=${page}&limit=12`;
    let response = await fetch(url);
    let data = await response.json();

    let detailed = await Promise.all(
        data.data.map(async (item) => {
            let r = await fetch(item.api_link);
            let detail = await r.json();
            return detail.data;
        })
    );

    let sounds = detailed.filter((art) =>
        art.has_multimedia_resources ||
        (art.medium_display || '').toLowerCase().includes('audio') ||
        (art.medium_display || '').toLowerCase().includes('sound') ||
        (art.description || '').toLowerCase().includes('audio') ||
        (art.description || '').toLowerCase().includes('sound')
    );

    checkSounds(sounds);
    renderSounds(res, 'sounds', page);
});

app.listen(3000, () => {
    console.log('server started');
});

function checkGallery(exibitionsInfo) {
    for (let i = 0; i < 2; i++) {
        if (exibitionsInfo.data[i].is_featured) {
            isFeatured[i] = 'Yes';
            featured[i] = 'First featured: ' + exibitionsInfo.data[i].aic_start_at.split('T')[0];
        } else {
            isFeatured[i] = 'No';
            featured[i] = 'Featured from: ' + exibitionsInfo.data[i].aic_start_at.split('T')[0] + ' to ' + exibitionsInfo.data[i].aic_end_at.split('T')[0];
        }

        if (exibitionsInfo.data[i].image_url) {
            galleryImg[i] = exibitionsInfo.data[i].image_url;
        } else {
            galleryImg[i] = 'img/no_image.png';
        }

        if (exibitionsInfo.data[i].short_description) {
            galleryDescription[i] = exibitionsInfo.data[i].short_description;
        } else {
            galleryDescription[i] = 'No description available';
        }

        if (exibitionsInfo.data[i].web_url) {
            galleryWebURL[i] = exibitionsInfo.data[i].web_url;
        } else {
            galleryWebURL[i] = 'http://www.artic.edu';
        }
    }
};

async function checkArtwork(artworksInfo) {
    let config = 'https://www.artic.edu/iiif/2/';
    let imgEnd = '/full/843,/0/default.jpg';

    for (let i = 0; i < artworksInfo.data.length; i++) {
        let imageId = artworksInfo.data[i].api_link;

        let artRes = await fetch(imageId);
        let artData = await artRes.json();

        if (artData.data.title) {
            artworkTitle[i] = artData.data.title;
        } else {
            artworkTitle[i] = 'Untitled';
        }
        if (artData.data.image_id) {
            artworkImg[i] = config + artData.data.image_id + imgEnd;
        } else {
            artworkImg[i] = 'img/no_image.png';
        }
        if (artData.data.artist_display) {
            artworkArtist[i] = artData.data.artist_display;
        } else {
            artworkArtist[i] = 'Unknown';
        }
        if (artData.data.description) {
            artworkDescription[i] = artData.data.description;
        } else {
            artworkDescription[i] = 'No description';
        }
        if (artData.data.place_of_origin) {
            artworkOrigin[i] = artData.data.place_of_origin;
        } else {
            artworkOrigin[i] = 'Unknown';
        }
    }


};

function checkVideos(videos) {
    let video = videos[0] || null;

    if (video) {
        videoTitle = video.title || 'Untitled';
        videoArtist = video.artist_display || 'Unknown';
        videoMedium = video.medium_display || 'Not listed';
        videoDate = video.date_display || 'Unknown';
        videoDescription = video.description || 'No description available';
        videoId = video.id || '';

        if (video.image_id) {
            videoImg = `https://www.artic.edu/iiif/2/${video.image_id}/full/843,/0/default.jpg`;
        } else {
            videoImg = '/img/no_image.png';
        }
    } else {
        videoTitle = 'No video artwork found';
        videoArtist = 'Unknown';
        videoMedium = 'Not listed';
        videoDate = 'Unknown';
        videoDescription = 'No video artwork found.';
        videoId = '';
        videoImg = '/img/no_image.png';
    }
}

function checkSounds(sounds) {
    let sound = sounds[0] || null;

    if (sound) {
        soundTitle = sound.title || 'Untitled';
        soundArtist = sound.artist_display || 'Unknown';
        soundDate = sound.date_display || 'Unknown';
        soundDescription = sound.description || 'No description available';
        soundId = sound.id || '';
        hasSoundMedia = sound.has_multimedia_resources ? 'Yes' : 'No';

        if (sound.image_id) {
            soundImg = `https://www.artic.edu/iiif/2/${sound.image_id}/full/max/0/default.jpg`;
        } else {
            soundImg = '/img/no_image.png';
        }
    } else {
        soundTitle = 'No sound artwork found';
        soundArtist = 'Unknown';
        soundDate = 'Unknown';
        soundDescription = 'No sound-related artwork found.';
        soundId = '';
        hasSoundMedia = 'No';
        soundImg = '/img/no_image.png';
    }
}

function renderGallery(res, string, exibitionsInfo, page) {
    res.render(string, {
        exibitionsInfo,
        isFeatured,
        featured,
        galleryImg,
        galleryDescription,
        galleryWebURL,
        currentPage: page,
        baseRoute: '/gallery'
    });
};

function renderArtwork(res, string, page) {
    res.render(string, {
        artworkImg,
        artworkTitle,
        artworkArtist,
        artworkDescription,
        artworkOrigin,
        currentPage: page,
        baseRoute: '/artwork'
    });
};

function renderVideos(res, string, page) {
    res.render(string, {
        videoTitle,
        videoArtist,
        videoMedium,
        videoDate,
        videoDescription,
        videoImg,
        videoId,
        currentPage: page,
        baseRoute: '/videos'
    });
}

function renderSounds(res, string, page) {
    res.render(string, {
        soundTitle,
        soundArtist,
        soundDate,
        soundDescription,
        soundImg,
        soundId,
        hasSoundMedia,
        currentPage: page,
        baseRoute: '/sounds'
    });
}
import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {VideoModel} from '../models/video';

const youTubeGoogleAPIKey = 'apiKeyPointHere';
const chanelId = 'UC-2Y8dQb0S6DtpxNgAKoJKA';
const apiUrl = 'https://www.googleapis.com/youtube/v3';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  private videosFromChanel: BehaviorSubject<VideoModel[]> = new BehaviorSubject([]);
  private nextPageToken: string;
  private uploadsId: string;

  public videosList = this.videosFromChanel.asObservable();

  constructor(private http: HttpClient) {
     this.getUploadsChannelId().then(resp => {
       this.uploadsId = resp;
       this.getVideosFromChanel();
     });
  }

  public getVideosFromChanel() {
    this.http.get(
      `${apiUrl}/playlistItems?part=snippet&maxResults=50&playlistId=${this.uploadsId}&key=${youTubeGoogleAPIKey}`
    ).toPromise().then((resp: any) => {
      this.nextPageToken = resp.nextPageToken;
      this.videosFromChanel.next(
        this.normalizeVideo(resp.items)
      );
    });
  }

  public loadMoreVideos(): Promise<any> {
    if (!this.nextPageToken) {
      return;
    }
    this.http.get(
      `${apiUrl}/playlistItems?part=snippet
            &playlistId=${this.uploadsId}
            &pageToken=${this.nextPageToken}
            &key=${youTubeGoogleAPIKey}`
    ).toPromise().then((resp: any) => {
      this.nextPageToken = resp.nextPageToken;
      this.videosFromChanel.next(
        [
          ...this.videosFromChanel.getValue(),
          ...this.normalizeVideo(resp.items)
        ]
      );
    });
  }

  private getUploadsChannelId(): Promise<string> {
    return this.http.get(`${apiUrl}/channels?part=contentDetails&id=${chanelId}&key=${youTubeGoogleAPIKey}`).
      toPromise().then((data: any) => data.items[0].contentDetails.relatedPlaylists.uploads);
  }

  private normalizeVideo(videoArray: any[]): VideoModel[] {
    return videoArray.map(el => ({
      id: el.snippet.resourceId.videoId,
      title: el.snippet.title,
      thumbnail: el.snippet.thumbnails.medium.url
    }));
  }
}

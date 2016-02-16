#!/usr/bin/env python

#import sys
#import time
#import logging
#from watchdog.observers import Observer
#from watchdog.events import LoggingEventHandler, FileSystemEventHandler
import os

TMP_PATH = '/tmp/'
OUTPUT_PATH = 'js/'

UGLIFY = True

class Packer(object):
    def __init__(self, output=None):
        self._contents = []
        
        self.acumulative_size = 0
        self.output = output
    
    def _pack_list(self, path):
        for filename in os.listdir(path):
            filepath = os.path.join(path, filename)
            if os.path.isdir(filepath) or not filename[-2:] == 'js' or filename == self.output:
                continue
            
            filesize = round(os.path.getsize(filepath) / 1024.0, 2)
            
            print "Packing %s [%skB]" % (filepath, filesize,)
            
            self.acumulative_size += filesize
            self._contents.append(file(filepath).read())
    
    def _pack_walk(self, path):
        for root, dirs, files in os.walk(path):
            self._pack_list(root)
    
    def pack(self, path, walk=False):
        if not walk:
            self._pack_list(path)
        else:
            self._pack_walk(path)
    
    def finalize(self):
        print '---------------------------------------'
        print 'Compressing...'
        tmp_file_path = '%s%s' % (TMP_PATH, self.output,)
        output_path = '%s%s' % (OUTPUT_PATH, self.output,)
        with open('%s' % tmp_file_path, 'wb+') as f:
            for fc in self._contents:
                f.write(fc)
            f.close()
        
        if UGLIFY:
            cmd = 'uglifyjs %s > %s' % (
                tmp_file_path,
                output_path
            )
        else:
            cmd = 'cp %s %s' % (tmp_file_path, output_path, )
        
        os.system(cmd)
        
        print "\b complete"
        
        packed_size = round(os.path.getsize(output_path) / 1024.0,2)
        diff = self.acumulative_size - packed_size
        compression_ratio = round((diff / self.acumulative_size) * 100.0, 2)
        
        print "Total original size: %skB" % (self.acumulative_size,)
        print "Packed size: %skB" % (packed_size,)
        print "Compression ratio: %s%%" % (compression_ratio)

if __name__ == "__main__":
    
    packer = Packer(output='tk-min.js')
    packer.pack('js/libs/ext/')
    packer.pack('js/')
    packer.pack('js/libs/')
    packer.pack('js/apps/', walk=True)
    packer.finalize()
    
    """logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    path = sys.argv[1] if len(sys.argv) > 1 else '.'
    event_handler = LoggingEventHandler()
    
    class Builder(FileSystemEventHandler):
        def on_any_event(self, event):
            if event.is_directory or not '.js' in event.src_path or 'hg-checkexec' in event.src_path\
                or 'pack.py' in event.src_path or 'tk-min.js' in event.src_path:
                return
            
            packer = Packer(output='tk-min.js')
            packer.pack('js/')
            packer.pack('js/libs/', walk=True)
            packer.pack('js/apps/', walk=True)
            packer.finalize()
    
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.schedule(Builder(), path, recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()"""